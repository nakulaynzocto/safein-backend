/**
 * Input Sanitization Middleware
 * 
 * Protects against:
 * - NoSQL Injection attacks
 * - XSS (Cross-Site Scripting)
 * - Command Injection
 * - Path Traversal
 * 
 * Security Best Practices:
 * - Sanitize all user inputs
 * - Remove dangerous characters and patterns
 * - Validate data types
 * - Use parameterized queries (MongoDB handles this, but we add extra protection)
 */

import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import { param, validationResult } from 'express-validator';

/**
 * Helper to recursively check values against a predicate
 */
const hasDangerousValue = (value: any, predicate: (str: string) => boolean): boolean => {
  if (typeof value === 'string') {
    return predicate(value);
  }
  if (Array.isArray(value)) {
    return value.some(item => hasDangerousValue(item, predicate));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some(val => hasDangerousValue(val, predicate));
  }
  return false;
};

/**
 * Sanitize strings to prevent XSS
 */
const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return str;

  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick, onerror, etc.)
    .replace(/data:text\/html/gi, '') // Remove data URIs with HTML
    .trim();
};

/**
 * Recursively sanitize objects
 */
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Sanitize key as well
        const sanitizedKey = sanitizeString(key);
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * NoSQL Injection Protection
 * Removes MongoDB operators from user input
 */
export const noSQLInjectionProtection = mongoSanitize({
  replaceWith: '_', // Replace dangerous characters with underscore
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] NoSQL injection attempt detected: ${key} in ${req.path}`);
  }
});

/**
 * XSS Protection Middleware
 * Sanitizes request body, query, and params
 */
export const xssProtection = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && Object.keys(req.body).length > 0) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && Object.keys(req.query).length > 0) {
    req.query = sanitizeObject(req.query) as any;
  }

  if (req.params && Object.keys(req.params).length > 0) {
    req.params = sanitizeObject(req.params) as any;
  }

  next();
};

/**
 * Common fields that are safe to contain special characters in search/filter contexts.
 */
const EXEMPT_KEYS = ['search', 'search_query', 'query', 'department', 'designation', 'company', 'city', 'state', 'country', 'purpose', 'notes', 'securityNotes'];

/**
 * Filter out exempt fields from an input object for security scanning
 */
const filterExemptFields = (inputs: any): any => {
  return Object.fromEntries(
    Object.entries(inputs).filter(([key]) => !EXEMPT_KEYS.includes(key))
  );
};

/**
 * Path Traversal Protection
 * Prevents directory traversal attacks in file paths
 */
export const pathTraversalProtection = (req: Request, res: Response, next: NextFunction): void => {
  const dangerousPatterns = [
    /(^|[/\\])\.\.([/\\]|$)/, // Parent directory traversal (matches ../ or ..\ or .. at end)
    /%2e%2e/i,        // URL encoded ..
    /\.[\/\\]\.\./,   // ./..
  ];

  const allInputs = { ...req.body, ...req.query, ...req.params };
  const scanInputs = filterExemptFields(allInputs);

  const isDangerous = (str: string) => dangerousPatterns.some(pattern => pattern.test(str));

  if (hasDangerousValue(scanInputs, isDangerous)) {
    console.warn(`[SECURITY] Path traversal attempt detected from IP: ${req.ip}`);
    res.status(400).json({
      success: false,
      message: 'Invalid path detected',
      statusCode: 400
    });
    return;
  }

  next();
};

/**
 * Command Injection Protection
 * Prevents shell command injection in inputs
 */
export const commandInjectionProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Only block truly dangerous shell characters. 
  // Removed commonly used characters: ; | & ( ) < > \n \r which are frequent in normal text.
  // Kept mostly shell-specific execution tokens.
  const dangerousChars = ['`', '$'];

  const allInputs = { ...req.body, ...req.query, ...req.params };
  const scanInputs = filterExemptFields(allInputs);

  const isDangerous = (str: string) => dangerousChars.some(char => str.includes(char));

  if (hasDangerousValue(scanInputs, isDangerous)) {
    console.warn(`[SECURITY] Command injection attempt detected from IP: ${req.ip}`);
    res.status(400).json({
      success: false,
      message: 'Invalid characters detected',
      statusCode: 400
    });
    return;
  }

  next();
};

/**
 * Validate and sanitize MongoDB ObjectId
 */
export const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }
    next();
  }
];

/**
 * Combined Input Sanitization Middleware
 * Applies all sanitization checks
 */
export const inputSanitization = [
  noSQLInjectionProtection,
  xssProtection,
  pathTraversalProtection,
  commandInjectionProtection
];
