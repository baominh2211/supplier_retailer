import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  API_URL: z.string().url().default('http://localhost:3001'),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.string().transform(Number).default('2'),
  DATABASE_POOL_MAX: z.string().transform(Number).default('10'),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('B2B Marketplace <noreply@example.com>'),

  // Storage
  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  STORAGE_PATH: z.string().default('./uploads'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_REGION: z.string().default('us-east-1'),

  // Security
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // App
  APP_NAME: z.string().default('B2B Marketplace'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  isDev: parsed.data.NODE_ENV === 'development',
  isProd: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',

  server: {
    port: parsed.data.PORT,
    apiUrl: parsed.data.API_URL,
  },

  database: {
    url: parsed.data.DATABASE_URL,
    poolMin: parsed.data.DATABASE_POOL_MIN,
    poolMax: parsed.data.DATABASE_POOL_MAX,
  },

  redis: {
    url: parsed.data.REDIS_URL,
  },

  jwt: {
    secret: parsed.data.JWT_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },

  email: {
    host: parsed.data.SMTP_HOST,
    port: parsed.data.SMTP_PORT,
    user: parsed.data.SMTP_USER,
    pass: parsed.data.SMTP_PASS,
    from: parsed.data.SMTP_FROM,
  },

  storage: {
    type: parsed.data.STORAGE_TYPE,
    path: parsed.data.STORAGE_PATH,
    s3: {
      accessKeyId: parsed.data.AWS_ACCESS_KEY_ID,
      secretAccessKey: parsed.data.AWS_SECRET_ACCESS_KEY,
      bucket: parsed.data.AWS_S3_BUCKET,
      region: parsed.data.AWS_S3_REGION,
    },
  },

  security: {
    corsOrigin: parsed.data.CORS_ORIGIN,
    rateLimitWindowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: parsed.data.RATE_LIMIT_MAX_REQUESTS,
  },

  app: {
    name: parsed.data.APP_NAME,
    frontendUrl: parsed.data.FRONTEND_URL,
  },
} as const;

export type Config = typeof config;
