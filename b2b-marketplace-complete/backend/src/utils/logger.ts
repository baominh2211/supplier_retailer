import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.isDev ? 'debug' : 'info',
  transport: config.isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: config.env,
  },
  redact: {
    paths: ['password', 'passwordHash', 'token', 'refreshToken', 'authorization'],
    censor: '[REDACTED]',
  },
});

export default logger;
