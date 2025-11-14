import rateLimit from 'express-rate-limit';
import { ERROR_CODES, CONSTANTS } from '../utils/constants';

const isDevelopment = CONSTANTS.NODE_ENV === 'development';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 1000 : 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    statusCode: ERROR_CODES.TOO_MANY_REQUESTS
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 50 : 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    statusCode: ERROR_CODES.TOO_MANY_REQUESTS
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDevelopment ? 10 : 3,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
    statusCode: ERROR_CODES.TOO_MANY_REQUESTS
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
});

export default generalLimiter;
