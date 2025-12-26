/**
 * File Upload Security Middleware
 * 
 * Protects against:
 * - Malicious file uploads
 * - Script execution in uploaded files
 * - Storage abuse
 * - File type spoofing
 * 
 * Security Best Practices:
 * - Whitelist allowed file types
 * - Verify file content (not just extension)
 * - Limit file size
 * - Scan for malicious content
 * - Store files outside web root
 * - Disable script execution
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errorHandler';
import { ERROR_CODES } from '../../utils/constants';
import sharp from 'sharp';

/**
 * Allowed MIME types for image uploads
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

/**
 * Allowed file extensions
 */
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

/**
 * Maximum file size (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Dangerous file extensions that should never be allowed
 */
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
  '.jar', '.sh', '.php', '.asp', '.aspx', '.jsp', '.py', '.rb',
  '.pl', '.cgi', '.htaccess', '.htpasswd'
];

/**
 * Validate file type by checking actual file content
 */
const validateFileContent = async (buffer: Buffer, mimetype: string): Promise<boolean> => {
  try {
    // For images, verify using Sharp
    if (mimetype.startsWith('image/')) {
      const metadata = await sharp(buffer).metadata();
      return !!metadata.format; // If Sharp can read it, it's a valid image
    }

    // For SVG, check if it's valid XML
    if (mimetype === 'image/svg+xml') {
      const content = buffer.toString('utf-8');
      // Basic SVG validation - check for SVG tag
      return content.includes('<svg') && !content.includes('<script');
    }

    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Check if filename is safe
 */
const isSafeFilename = (filename: string): boolean => {
  const lowerFilename = filename.toLowerCase();

  // Check for dangerous extensions
  if (DANGEROUS_EXTENSIONS.some(ext => lowerFilename.endsWith(ext))) {
    return false;
  }

  // Check for path traversal
  if (lowerFilename.includes('..') || lowerFilename.includes('/') || lowerFilename.includes('\\')) {
    return false;
  }

  // Check for null bytes
  if (lowerFilename.includes('\0')) {
    return false;
  }

  return true;
};

/**
 * Sanitize filename
 */
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars
    .replace(/\.\./g, '_') // Remove path traversal
    .substring(0, 255); // Limit length
};

/**
 * File Upload Security Validation Middleware
 */
export const validateFileUpload = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const file = req.file;

  if (!file) {
    return next();
  }

  try {
    // 1. Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError(
        `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
        ERROR_CODES.BAD_REQUEST
      );
    }

    // 2. Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError(
        'Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP, SVG)',
        ERROR_CODES.BAD_REQUEST
      );
    }

    // 3. Validate filename
    if (!isSafeFilename(file.originalname)) {
      console.warn(`[SECURITY] Dangerous filename detected: ${file.originalname} from IP: ${req.ip}`);
      throw new AppError('Invalid filename', ERROR_CODES.BAD_REQUEST);
    }

    // 4. Sanitize filename
    file.originalname = sanitizeFilename(file.originalname);

    // 5. Validate file extension
    const extension = file.originalname.toLowerCase().substring(
      file.originalname.lastIndexOf('.')
    );
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new AppError('Invalid file extension', ERROR_CODES.BAD_REQUEST);
    }

    // 6. Validate file content (verify it's actually an image)
    if (file.buffer) {
      const isValidContent = await validateFileContent(file.buffer, file.mimetype);
      if (!isValidContent) {
        console.warn(`[SECURITY] File content validation failed: ${file.originalname} from IP: ${req.ip}`);
        throw new AppError('Invalid file content. File may be corrupted or malicious.', ERROR_CODES.BAD_REQUEST);
      }
    }

    // 7. Additional security: Check for embedded scripts in SVG
    if (file.mimetype === 'image/svg+xml' && file.buffer) {
      const svgContent = file.buffer.toString('utf-8');
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
      ];

      if (dangerousPatterns.some(pattern => pattern.test(svgContent))) {
        console.warn(`[SECURITY] Malicious SVG detected: ${file.originalname} from IP: ${req.ip}`);
        throw new AppError('SVG file contains potentially malicious content', ERROR_CODES.BAD_REQUEST);
      }
    }

    next();
    return;
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    } else {
      next(new AppError('File validation failed', ERROR_CODES.BAD_REQUEST));
      return;
    }
  }
};

/**
 * File size limit middleware (applied before multer)
 */
export const fileSizeLimit = (maxSize: number = MAX_FILE_SIZE) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > maxSize) {
      res.status(413).json({
        success: false,
        message: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
        statusCode: 413
      });
      return;
    }

    next();
  };
};

