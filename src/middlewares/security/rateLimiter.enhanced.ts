/**
 * Enhanced Rate Limiting Middleware
 * 
 * Features:
 * - Per-IP rate limiting with Redis store
 * - Per-user rate limiting (for authenticated requests)
 * - Different limits for different endpoint types
 * - Brute force protection
 * 
 * Security Best Practices:
 * - Use Redis for distributed rate limiting (works across multiple servers)
 * - Stricter limits for authentication endpoints
 * - Progressive rate limiting (stricter after violations)
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../../config/redis.config';
import { ERROR_CODES, CONSTANTS } from '../../utils/constants';
import { Request, Response } from 'express';

const isDevelopment = CONSTANTS.NODE_ENV === 'development';


// Get Redis client (with fallback if Redis is not available)
const getRedisStore = () => {
  try {
    const redisClient = getRedisClient();
    // rate-limit-redis v3+ API
    return new RedisStore({
      sendCommand: async (command: string, ...args: (string | number)[]): Promise<any> => {
        return redisClient.call(command, ...args);
      },
    } as any);
  } catch (error) {
    // Fallback to memory store if Redis is not available
    console.warn('Redis not available for rate limiting, using memory store');
    return undefined;
  }
};

/**
 * General API Rate Limiter
 * - 100 requests per 15 minutes per IP (production)
 * - Prevents API abuse and DDoS
 */
export const generalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // requests per window
  store: getRedisStore(),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    statusCode: ERROR_CODES.TOO_MANY_REQUESTS
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: () => isDevelopment, // Skip in development
  handler: (_req: Request, res: Response) => {
    res.status(ERROR_CODES.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      statusCode: ERROR_CODES.TOO_MANY_REQUESTS,
      retryAfter: Math.ceil(15 * 60) // seconds
    });
  }
});

/**
 * Authentication Rate Limiter (Stricter)
 * - 5 login attempts per 15 minutes per IP
 * - Prevents brute force attacks
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Set to 5 for both dev and prod as requested
  store: getRedisStore(),
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    statusCode: ERROR_CODES.TOO_MANY_REQUESTS
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all attempts, even successful ones
  handler: (_req: Request, res: Response) => {
    res.status(ERROR_CODES.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many authentication attempts. Your IP has been temporarily blocked. Please try again after 15 minutes.',
      statusCode: ERROR_CODES.TOO_MANY_REQUESTS,
      retryAfter: Math.ceil(15 * 60)
    });
  }
});

/**
 * Password Reset Rate Limiter (Very Strict)
 * - 3 attempts per hour per IP
 * - Prevents password reset abuse
 */
export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  store: getRedisStore(),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(ERROR_CODES.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many password reset attempts. Please try again after 1 hour.',
      statusCode: ERROR_CODES.TOO_MANY_REQUESTS,
      retryAfter: Math.ceil(60 * 60)
    });
  }
});

/**
 * File Upload Rate Limiter
 * - 10 uploads per hour per IP
 * - Prevents storage abuse
 */
export const uploadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req: any) => {
    // Logged in users (Admin/Employee) get 100, public links or unknown get 10
    return req.user ? 100 : 10;
  },
  store: getRedisStore(),
  keyGenerator: (req: any): string => {
    // Priority: User ID > Appointment Link ID > IP
    return req.user?._id?.toString() || req.appointmentLink?._id?.toString() || req.ip || 'unknown';
  },
  message: {
    success: false,
    message: 'Too many file uploads. Please try again later.',
    statusCode: ERROR_CODES.TOO_MANY_REQUESTS
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Public Action Rate Limiter (for Booking, Approval, etc.)
 * - 20 actions per hour per IP/Token
 * - Prevents spamming of public forms
 */
export const publicActionLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 40,
  store: getRedisStore(),
  keyGenerator: (req: any): string => {
    return req.params?.token || req.query?.token || req.ip || 'unknown';
  },
  message: {
    success: false,
    message: 'Too many actions from this link/IP. Please try again after 1 hour.',
    statusCode: ERROR_CODES.TOO_MANY_REQUESTS
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Per-User Rate Limiter (for authenticated requests)
 * - 200 requests per 15 minutes per user
 * - Applied to authenticated endpoints
 */
export const createUserRateLimiter = (): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDevelopment ? 2000 : 200,
    store: getRedisStore(),
    keyGenerator: (req: any) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?._id?.toString() || req.ip || 'unknown';
    },
    message: {
      success: false,
      message: 'Too many requests. Please slow down.',
      statusCode: ERROR_CODES.TOO_MANY_REQUESTS
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDevelopment,
  });
};

export const userLimiter = createUserRateLimiter();
