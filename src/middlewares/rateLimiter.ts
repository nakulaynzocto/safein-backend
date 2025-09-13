import rateLimit from 'express-rate-limit';
import { ERROR_CODES, CONSTANTS } from '../utils/constants';

// Environment-based rate limiting configuration
const isDevelopment = CONSTANTS.NODE_ENV === 'development';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // More lenient in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    statusCode: ERROR_CODES.TOO_MANY_REQUESTS
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development for easier testing
  skip: () => isDevelopment,
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 50 : 10, // More lenient in development
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    statusCode: ERROR_CODES.TOO_MANY_REQUESTS
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development for easier testing
  skip: () => isDevelopment,
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDevelopment ? 10 : 3, // More lenient in development
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    statusCode: ERROR_CODES.TOO_MANY_REQUESTS
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development for easier testing
  skip: () => isDevelopment,
});

export default generalLimiter;
