/**
 * Login Attempt Tracker
 * 
 * Features:
 * - Tracks login attempts per email/IP combination
 * - Integrates with brute force protection
 * - Logs suspicious activity
 * - Provides account lockout after multiple failures
 * 
 * Security Best Practices:
 * - Track both email and IP for better security
 * - Progressive lockout periods
 * - Clear attempts on successful login
 * - Log all authentication events
 */

import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../../config/redis.config';
import { recordFailedAttempt, clearFailedAttempts } from './bruteForceProtection';
import { getClientIP } from './bruteForceProtection';

interface LoginAttempt {
  email: string;
  ip: string;
  timestamp: string;
  success: boolean;
  userAgent?: string;
}

/**
 * Track login attempt
 */
export const trackLoginAttempt = async (
  email: string,
  ip: string,
  success: boolean,
  userAgent?: string
): Promise<void> => {
  try {
    const redis = getRedisClient();
    const attempt: LoginAttempt = {
      email: email.toLowerCase(),
      ip,
      timestamp: new Date().toISOString(),
      success,
      userAgent
    };

    // Store attempt in Redis (keep last 50 attempts per email)
    const key = `login:attempts:${email.toLowerCase()}`;
    await redis.lpush(key, JSON.stringify(attempt));
    await redis.ltrim(key, 0, 49); // Keep only last 50
    await redis.expire(key, 24 * 60 * 60); // Expire after 24 hours

    if (!success) {
      // Record failed attempt for brute force protection
      await recordFailedAttempt(ip);

      // Log security event
      console.warn(`[SECURITY] Failed login attempt: ${email} from IP: ${ip}`);
    } else {
      // Clear failed attempts on successful login
      await clearFailedAttempts(ip);

      // Log successful login
      console.info(`[AUTH] Successful login: ${email} from IP: ${ip}`);
    }
  } catch (error) {
    console.error('Failed to track login attempt:', error);
  }
};

/**
 * Get login attempt history for an email
 */
export const getLoginAttemptHistory = async (
  email: string,
  limit: number = 10
): Promise<LoginAttempt[]> => {
  try {
    const redis = getRedisClient();
    const key = `login:attempts:${email.toLowerCase()}`;
    const attempts = await redis.lrange(key, 0, limit - 1);

    return attempts.map(attempt => JSON.parse(attempt));
  } catch (error) {
    console.error('Failed to get login attempt history:', error);
    return [];
  }
};

/**
 * Check if account should be locked due to too many failed attempts
 */
export const shouldLockAccount = async (email: string): Promise<{
  locked: boolean;
  failedAttempts: number;
  lockoutUntil?: Date;
}> => {
  try {
    const history = await getLoginAttemptHistory(email, 10);
    const recentFailures = history
      .filter(attempt => !attempt.success)
      .filter(attempt => {
        const attemptTime = new Date(attempt.timestamp).getTime();
        const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
        return attemptTime > fifteenMinutesAgo;
      });

    const maxFailedAttempts = 5;

    if (recentFailures.length >= maxFailedAttempts) {
      // Account should be locked
      const oldestFailure = recentFailures[recentFailures.length - 1];
      const lockoutUntil = new Date(new Date(oldestFailure.timestamp).getTime() + 15 * 60 * 1000);

      return {
        locked: Date.now() < lockoutUntil.getTime(),
        failedAttempts: recentFailures.length,
        lockoutUntil
      };
    }

    return {
      locked: false,
      failedAttempts: recentFailures.length
    };
  } catch (error) {
    console.error('Failed to check account lock status:', error);
    return { locked: false, failedAttempts: 0 };
  }
};

/**
 * Middleware to check account lock status before login
 */
export const checkAccountLock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const email = req.body?.email;

  if (!email) {
    return next();
  }

  const lockStatus = await shouldLockAccount(email);

  if (lockStatus.locked) {
    const remainingMinutes = lockStatus.lockoutUntil
      ? Math.ceil((lockStatus.lockoutUntil.getTime() - Date.now()) / (60 * 1000))
      : 15;

    res.status(429).json({
      success: false,
      message: `Account temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
      statusCode: 429,
      retryAfter: remainingMinutes * 60
    });
    return;
  }

  next();
};

/**
 * Middleware to track login attempts
 */
export const loginAttemptTracker = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    // Track login attempt after response
    if (req.path.includes('/login') && req.method === 'POST') {
      const email = req.body?.email;
      const ip = getClientIP(req);
      const userAgent = req.headers['user-agent'];
      const success = data?.success === true;

      if (email) {
        trackLoginAttempt(email, ip, success, userAgent).catch(err => {
          console.error('Failed to track login attempt:', err);
        });
      }
    }

    return originalJson(data);
  };

  return next();
};

