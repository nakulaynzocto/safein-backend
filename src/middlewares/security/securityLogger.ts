/**
 * Security Logging Middleware
 * 
 * Features:
 * - Logs all security-related events
 * - Tracks suspicious activity
 * - Monitors authentication attempts
 * - Records rate limit violations
 * - Logs file upload attempts
 * 
 * Security Best Practices:
 * - Log security events separately from application logs
 * - Include IP, user agent, timestamp
 * - Don't log sensitive data (passwords, tokens)
 * - Rotate security logs regularly
 */

import { Request, Response, NextFunction } from 'express';
import { appendFile } from 'fs/promises';
import { join } from 'path';

interface SecurityEvent {
  type: 'AUTH_ATTEMPT' | 'RATE_LIMIT' | 'BRUTE_FORCE' | 'SUSPICIOUS_INPUT' | 'FILE_UPLOAD' | 'UNAUTHORIZED_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  path: string;
  method: string;
  timestamp: string;
  details?: any;
}

/**
 * Get client IP from request
 */
const getClientIP = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

/**
 * Log security event
 */
export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  try {
    const logEntry = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString()
    }) + '\n';

    // In production, you might want to use a proper logging service
    // For now, we'll log to console and optionally to a file
    console.warn(`[SECURITY] ${event.severity}: ${event.type} - ${event.message}`, {
      ip: event.ip,
      path: event.path,
      userId: event.userId
    });

    // Optionally write to file (in production, use proper log rotation)
    if (process.env.LOG_SECURITY_EVENTS === 'true') {
      const logPath = join(process.cwd(), 'logs', 'security.log');
      await appendFile(logPath, logEntry).catch(() => {
        // Ignore file write errors (logging should not break the app)
      });
    }
  } catch (error) {
    // Logging failures should not break the application
    console.error('Failed to log security event:', error);
  }
};

/**
 * Security Event Logger Middleware
 * Logs security-related events automatically
 */
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log unauthorized access attempts
  const originalStatus = res.status.bind(res);
  res.status = function (code: number) {
    if (code === 401 || code === 403) {
      logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        message: `Unauthorized access attempt: ${code}`,
        ip: getClientIP(req),
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
    return originalStatus(code);
  };

  next();
};

/**
 * Log suspicious input patterns
 */
export const logSuspiciousInput = (
  req: Request,
  pattern: string,
  input: string
): void => {
  logSecurityEvent({
    type: 'SUSPICIOUS_INPUT',
    severity: 'HIGH',
    message: `Suspicious input pattern detected: ${pattern}`,
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?._id?.toString(),
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    details: {
      pattern,
      inputLength: input.length,
      // Don't log the actual input to avoid logging sensitive data
    }
  });
};

/**
 * Log rate limit violation
 */
export const logRateLimitViolation = (req: Request, limit: number): void => {
  logSecurityEvent({
    type: 'RATE_LIMIT',
    severity: 'MEDIUM',
    message: `Rate limit exceeded: ${limit} requests`,
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?._id?.toString(),
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log brute force attack
 */
export const logBruteForceAttack = (ip: string, attempts: number): void => {
  logSecurityEvent({
    type: 'BRUTE_FORCE',
    severity: 'CRITICAL',
    message: `Brute force attack detected: ${attempts} failed attempts`,
    ip,
    path: '/api/v1/users/login',
    method: 'POST',
    timestamp: new Date().toISOString(),
    details: { attempts }
  });
};

/**
 * Log file upload attempt
 */
export const logFileUpload = (
  req: Request,
  filename: string,
  size: number,
  success: boolean
): void => {
  logSecurityEvent({
    type: 'FILE_UPLOAD',
    severity: success ? 'LOW' : 'MEDIUM',
    message: `File upload ${success ? 'successful' : 'failed'}: ${filename}`,
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?._id?.toString(),
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    details: {
      filename,
      size,
      success
    }
  });
};

