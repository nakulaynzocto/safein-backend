/**
 * Enhanced Security Headers Configuration
 * 
 * Implements security headers using Helmet.js with best practices:
 * - Content Security Policy (CSP)
 * - XSS Protection
 * - Frame Options
 * - Content Type Options
 * - Referrer Policy
 * - Permissions Policy
 * 
 * Security Best Practices:
 * - Strict CSP to prevent XSS attacks
 * - Prevent clickjacking with frame options
 * - Disable MIME type sniffing
 * - Control referrer information leakage
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { CONSTANTS } from '../../utils/constants';

const isDevelopment = CONSTANTS.NODE_ENV === 'development';

/**
 * Enhanced Helmet Configuration
 * Provides comprehensive security headers
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: isDevelopment ? [] : [],
    },
  },
  
  // Prevent XSS attacks
  crossOriginEmbedderPolicy: false, // Disable for compatibility
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  
  // Prevent clickjacking
  frameguard: {
    action: 'deny'
  },
  
  // Disable MIME type sniffing
  noSniff: true,
  
  // XSS Protection (legacy browsers)
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  
  // Permissions Policy (formerly Feature Policy) - removed as it's not in helmet v7
  // Use helmet.permissionsPolicy() separately if needed
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Disable DNS prefetching
  dnsPrefetchControl: true,
  
  // Disable IE's X-Download-Options
  ieNoOpen: true,
});

/**
 * Custom Security Headers Middleware
 * Adds additional security headers not covered by Helmet
 */
export const customSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent caching of sensitive data
  if (req.path.startsWith('/api/v1')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options (redundant with Helmet, but ensures it's set)
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection (for legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

