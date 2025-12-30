/**
 * Brute Force Protection Middleware
 * 
 * Features:
 * - Tracks failed login attempts per IP
 * - Temporarily bans IPs after multiple failed attempts
 * - Progressive lockout (longer bans for repeated violations)
 * - Automatic unlock after ban period
 * 
 * Security Best Practices:
 * - Use Redis for distributed tracking
 * - Progressive penalties discourage repeated attacks
 * - Log all suspicious activity
 */

import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../../config/redis.config';
import { AppError } from '../errorHandler';
import { ERROR_CODES } from '../../utils/constants';

interface BruteForceConfig {
  maxAttempts: number; // Max failed attempts before ban
  banDurationMinutes: number; // Initial ban duration
  progressiveBanMultiplier: number; // Multiply ban duration for repeat offenders
  maxBanDurationMinutes: number; // Maximum ban duration
  windowMinutes: number; // Time window for tracking attempts
}

const DEFAULT_CONFIG: BruteForceConfig = {
  maxAttempts: 5,
  banDurationMinutes: 15,
  progressiveBanMultiplier: 2,
  maxBanDurationMinutes: 60 * 24, // 24 hours max
  windowMinutes: 15
};

/**
 * Get client IP address from request
 */
export const getClientIP = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

/**
 * Get Redis keys for brute force tracking
 */
const getKeys = (ip: string) => {
  const baseKey = `bruteforce:${ip}`;
  return {
    attempts: `${baseKey}:attempts`,
    banned: `${baseKey}:banned`,
    banCount: `${baseKey}:bancount`
  };
};

/**
 * Check if IP is currently banned
 */
const isIPBanned = async (ip: string): Promise<{ banned: boolean; remainingSeconds?: number }> => {
  try {
    const redis = getRedisClient();
    const keys = getKeys(ip);
    
    const banInfo = await redis.get(keys.banned);
    if (!banInfo) {
      return { banned: false };
    }

    const banData = JSON.parse(banInfo);
    const banExpiry = new Date(banData.expiresAt).getTime();
    const now = Date.now();

    if (now < banExpiry) {
      const remainingSeconds = Math.ceil((banExpiry - now) / 1000);
      return { banned: true, remainingSeconds };
    } else {
      // Ban expired, clean up
      await redis.del(keys.banned);
      return { banned: false };
    }
  } catch (error) {
    // If Redis fails, allow request (fail open for availability)
    console.error('Brute force check failed:', error);
    return { banned: false };
  }
};

/**
 * Record a failed login attempt
 */
export const recordFailedAttempt = async (ip: string): Promise<void> => {
  try {
    const redis = getRedisClient();
    const keys = getKeys(ip);
    const config = DEFAULT_CONFIG;

    // Increment attempt counter
    const attempts = await redis.incr(keys.attempts);
    await redis.expire(keys.attempts, config.windowMinutes * 60);

    // If max attempts reached, ban the IP
    if (attempts >= config.maxAttempts) {
      const banCount = await redis.incr(keys.banCount);
      await redis.expire(keys.banCount, config.maxBanDurationMinutes * 60);

      // Progressive ban duration
      const banMultiplier = Math.min(
        Math.pow(config.progressiveBanMultiplier, banCount - 1),
        config.maxBanDurationMinutes / config.banDurationMinutes
      );
      const banDuration = Math.min(
        config.banDurationMinutes * banMultiplier,
        config.maxBanDurationMinutes
      );

      const banData = {
        ip,
        bannedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + banDuration * 60 * 1000).toISOString(),
        banCount,
        banDurationMinutes: banDuration
      };

      await redis.setex(keys.banned, banDuration * 60, JSON.stringify(banData));

      // Log security event
      console.warn(`[SECURITY] IP ${ip} banned for ${banDuration} minutes after ${attempts} failed attempts (Ban #${banCount})`);
    }
  } catch (error) {
    console.error('Failed to record brute force attempt:', error);
  }
};

/**
 * Clear failed attempts for an IP (on successful login)
 */
export const clearFailedAttempts = async (ip: string): Promise<void> => {
  try {
    const redis = getRedisClient();
    const keys = getKeys(ip);
    await redis.del(keys.attempts);
  } catch (error) {
    console.error('Failed to clear brute force attempts:', error);
  }
};

/**
 * Brute Force Protection Middleware
 * Checks if IP is banned before allowing authentication requests
 */
export const bruteForceProtection = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const ip = getClientIP(req);
  const banStatus = await isIPBanned(ip);

  if (banStatus.banned) {
    const remainingMinutes = Math.ceil((banStatus.remainingSeconds || 0) / 60);
    
    throw new AppError(
      `Your IP has been temporarily banned due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
      ERROR_CODES.TOO_MANY_REQUESTS
    );
  }

  next();
};

/**
 * Get brute force statistics for an IP (for monitoring)
 */
export const getBruteForceStats = async (ip: string): Promise<{
  attempts: number;
  banned: boolean;
  banInfo?: any;
  banCount: number;
}> => {
  try {
    const redis = getRedisClient();
    const keys = getKeys(ip);

    const [attempts, banned, banCount] = await Promise.all([
      redis.get(keys.attempts),
      redis.get(keys.banned),
      redis.get(keys.banCount)
    ]);

    return {
      attempts: parseInt(attempts || '0', 10),
      banned: !!banned,
      banInfo: banned ? JSON.parse(banned) : undefined,
      banCount: parseInt(banCount || '0', 10)
    };
  } catch (error) {
    console.error('Failed to get brute force stats:', error);
    return { attempts: 0, banned: false, banCount: 0 };
  }
};

