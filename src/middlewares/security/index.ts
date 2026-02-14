/**
 * Security Middleware Index
 * Exports all security-related middleware
 */

// Rate Limiting
export {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  publicActionLimiter,
  userLimiter,
  createUserRateLimiter,
  supportInquiryLimiter
} from './rateLimiter.enhanced';

// Brute Force Protection
export {
  bruteForceProtection,
  recordFailedAttempt,
  clearFailedAttempts,
  getBruteForceStats,
  getClientIP
} from './bruteForceProtection';

// Input Sanitization
export {
  noSQLInjectionProtection,
  xssProtection,
  pathTraversalProtection,
  commandInjectionProtection,
  inputSanitization,
  validateObjectId
} from './inputSanitization';

// Security Headers
export {
  securityHeaders,
  customSecurityHeaders
} from './securityHeaders';

// Login Attempt Tracking
export {
  trackLoginAttempt,
  getLoginAttemptHistory,
  shouldLockAccount,
  checkAccountLock,
  loginAttemptTracker
} from './loginAttemptTracker';

// File Upload Security
export {
  validateFileUpload,
  fileSizeLimit
} from './fileUploadSecurity';

// Security Logging
export {
  logSecurityEvent,
  securityLogger,
  logSuspiciousInput,
  logRateLimitViolation,
  logBruteForceAttack,
  logFileUpload
} from './securityLogger';



