import Redis from 'ioredis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

// Create Redis client
export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error('Redis connection failed after 3 retries');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

// Cache utilities
export const cache = {
  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  },

  /**
   * Set a cached value with optional TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  /**
   * Delete a cached value
   */
  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    return redis.incr(key);
  },

  /**
   * Set expiration on a key
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    await redis.expire(key, ttlSeconds);
  },
};

// Cache key generators
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  supplier: (id: string) => `supplier:${id}`,
  shop: (id: string) => `shop:${id}`,
  product: (id: string) => `product:${id}`,
  category: (id: string) => `category:${id}`,
  categoryTree: () => 'categories:tree',
  negotiation: (id: string) => `negotiation:${id}`,
  purchaseIntent: (id: string) => `purchase-intent:${id}`,
  userSession: (userId: string, tokenId: string) => `session:${userId}:${tokenId}`,
  rateLimit: (key: string) => `rate-limit:${key}`,
  emailVerification: (token: string) => `email-verify:${token}`,
  passwordReset: (token: string) => `password-reset:${token}`,
};

export default redis;
