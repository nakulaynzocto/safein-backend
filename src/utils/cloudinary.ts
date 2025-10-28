import { v2 as cloudinary } from 'cloudinary';

// ==========================================
// Configuration
// ==========================================

/**
 * Parse Cloudinary configuration from environment variables
 * Supports both connection URL format and individual credentials
 */
const getCloudCreds = () => {
  const cloudNameUrl = process.env.CLOUDINARY_CLOUD_NAME || '';
  
  let cloudName = '';
  let apiKey = process.env.CLOUDINARY_API_KEY || '';
  let apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  
  // If CLOUDINARY_CLOUD_NAME is a full connection URL, extract everything
  if (cloudNameUrl.startsWith('cloudinary://')) {
    const match = cloudNameUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match && match.length >= 4) {
      cloudName = match[3].trim();
      apiKey = match[1];
      apiSecret = match[2];
      
      // Cloudinary config extracted from connection URL
    } else {
      console.error('Failed to parse Cloudinary connection URL');
    }
  } else {
    // Individual credentials provided
    cloudName = cloudNameUrl;
  }
  
  return { cloudName, apiKey, apiSecret };
};

// Initialize Cloudinary configuration
const { cloudName, apiKey, apiSecret } = getCloudCreds();

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else {
  console.error('Cloudinary configuration incomplete');
}

// ==========================================
// Constants
// ==========================================

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  UPLOAD_FOLDER: 'visitor-appointments',
  QUALITY: 'auto',
} as const;

// ==========================================
// Types
// ==========================================

export interface UploadResult {
  success: boolean;
  data?: {
    url: string;
    filename: string;
    size: number;
  };
  message?: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  quality?: string;
  resource_type?: 'auto' | 'image' | 'video' | 'raw';
  fetch_format?: string;
  flags?: string;
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Convert buffer to data URI for Cloudinary upload
 */
export const bufferToDataUri = (buffer: Buffer, mimetype: string): string => {
  const base64String = buffer.toString('base64');
  return `data:${mimetype};base64,${base64String}`;
};

/**
 * Generate optimized upload options for Cloudinary
 */
export const generateUploadOptions = (
  folder?: string,
  quality: string = UPLOAD_CONFIG.QUALITY
): CloudinaryUploadOptions => {
  return {
    folder: folder || UPLOAD_CONFIG.UPLOAD_FOLDER,
    resource_type: 'auto',
    // Quality optimization
    quality: quality,
    // Auto-optimize format based on browser support
    fetch_format: 'auto',
    // Optimization flags
    flags: 'progressive'
  };
};

// ==========================================
// Main Upload Function
// ==========================================

/**
 * Upload a file to Cloudinary with optimization
 * @param file - File buffer or object
 * @param options - Optional upload options
 * @returns UploadResult
 */
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  options?: CloudinaryUploadOptions
): Promise<UploadResult> => {
  try {
    // Validate file exists
    if (!file) {
      return {
        success: false,
        message: 'No file provided'
      };
    }

    // Convert buffer to data URI
    const dataUri = bufferToDataUri(file.buffer, file.mimetype);

    // Generate upload options with optimization
    const uploadOptions = generateUploadOptions(
      options?.folder,
      options?.quality
    );

    // Upload to Cloudinary
    const result = await new Promise<UploadResult>((resolve) => {
      cloudinary.uploader.upload(
        dataUri,
        uploadOptions,
        (error, uploadResult) => {
          if (error) {
            console.error('Cloudinary upload error:', error.message);
            resolve({
              success: false,
              message: error.message || 'Failed to upload file to Cloudinary'
            });
          } else if (uploadResult) {
            resolve({
              success: true,
              data: {
                url: uploadResult.secure_url,
                filename: uploadResult.original_filename || file.originalname,
                size: uploadResult.bytes
              }
            });
          } else {
            resolve({
              success: false,
              message: 'Upload failed - no response from Cloudinary'
            });
          }
        }
      );
    });

    return result;
  } catch (error: any) {
    console.error('Unexpected upload error:', error);
    return {
      success: false,
      message: error.message || 'Failed to upload file'
    };
  }
};

/**
 * Delete a file from Cloudinary
 * @param publicId - Cloudinary public ID or URL
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    // Extract public_id from URL if full URL is provided
    const actualPublicId = publicId.includes('/') 
      ? publicId.split('/').pop()?.split('.')[0] || publicId
      : publicId;

    return new Promise((resolve) => {
      cloudinary.uploader.destroy(actualPublicId, (error, result) => {
        if (error) {
          console.error('Cloudinary delete error:', error.message);
          resolve(false);
        } else {
          resolve(result.result === 'ok');
        }
      });
    });
  } catch (error: any) {
    console.error('Unexpected delete error:', error);
    return false;
  }
};

// Export cloudinary instance for other uses
export { cloudinary };
