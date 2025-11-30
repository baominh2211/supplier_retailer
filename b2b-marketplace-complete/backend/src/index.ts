import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

import { config } from './config/index.js';
import { prisma } from './config/database.js';
import { redis } from './config/redis.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { setupWebSocket } from './websocket/index.js';
import { initializeJobs } from './jobs/index.js';
import { logger } from './utils/logger.js';

// Create Express app
const app = express();
const server = createServer(app);

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.isProd,
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.security.corsOrigin.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

app.use('/api', limiter);

// Health check endpoints
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/health/ready', async (_req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis
    await redis.ping();

    res.json({
      status: 'ready',
      checks: {
        database: 'ok',
        redis: 'ok',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/health/live', (_req, res) => {
  res.json({ status: 'live' });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Setup WebSocket
const io = setupWebSocket(server);

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close database connection
      await prisma.$disconnect();
      logger.info('Database disconnected');

      // Close Redis connection
      await redis.quit();
      logger.info('Redis disconnected');

      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function start(): Promise<void> {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('Database connected');

    // Connect to Redis
    await redis.connect();
    logger.info('Redis connected');

    // Initialize background jobs
    if (!config.isTest) {
      initializeJobs();
    }

    // Start listening
    server.listen(config.server.port, () => {
      logger.info({
        port: config.server.port,
        env: config.env,
        url: `http://localhost:${config.server.port}`,
      }, 'Server started');
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled Rejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught Exception');
  process.exit(1);
});

// Start if not in test mode
if (!config.isTest) {
  start();
}

export { app, server, io };
