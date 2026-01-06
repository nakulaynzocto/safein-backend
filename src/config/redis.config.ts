import Redis from 'ioredis';
import { CONSTANTS } from '../utils/constants';

// Initialize Redis client globally with lazy connection
const redisUrl = CONSTANTS.REDIS_URL;
const redisClient = new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redisClient.on('connect', () => {
  if (CONSTANTS.NODE_ENV === 'development') {
    console.log('✓ Redis client connected');
  }
});

redisClient.on('error', (error) => {
  console.error('✗ Redis connection error:', error);
});

redisClient.on('close', () => {
  if (CONSTANTS.NODE_ENV === 'development') {
    console.log('⊗ Redis connection closed');
  }
});

export const connectRedis = async (): Promise<Redis> => {
  try {
    // Only connect if not already connected/connecting
    if (redisClient.status === 'wait' || redisClient.status === 'close') {
      await redisClient.connect();
    }
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Don't throw here to allow app to start without Redis (memory store will be used as fallback in rate limiter if redis command fails, though current logic might need valid client)
    // Actually, returning the client is fine, ioredis handles offline queue.
    return redisClient;
  }
};

export const getRedisClient = (): Redis => {
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient.status !== 'end') {
    await redisClient.quit();
  }
};

