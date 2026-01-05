import { v2 as cloudinary } from 'cloudinary';
import { CONSTANTS } from './constants';

const getCloudCreds = () => {
  return {
    cloudName: CONSTANTS.CLOUDINARY_CLOUD_NAME || '',
    apiKey: CONSTANTS.CLOUDINARY_API_KEY || '',
    apiSecret: CONSTANTS.CLOUDINARY_API_SECRET || ''
  };
};

const { cloudName, apiKey, apiSecret } = getCloudCreds();

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  UPLOAD_FOLDER: 'visitor-appointments',
  QUALITY: 'auto',
} as const;

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

export const bufferToDataUri = (buffer: Buffer, mimetype: string): string => {
  const base64String = buffer.toString('base64');
  return `data:${mimetype};base64,${base64String}`;
};

export const generateUploadOptions = (
  folder?: string,
  quality: string = UPLOAD_CONFIG.QUALITY
): CloudinaryUploadOptions => {
  return {
    folder: folder || UPLOAD_CONFIG.UPLOAD_FOLDER,
    resource_type: 'auto',
    quality: quality,
    fetch_format: 'auto',
    flags: 'progressive'
  };
};

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  options?: CloudinaryUploadOptions
): Promise<UploadResult> => {
  try {
    if (!file) {
      return {
        success: false,
        message: 'No file provided'
      };
    }

    const dataUri = bufferToDataUri(file.buffer, file.mimetype);

    const uploadOptions = generateUploadOptions(
      options?.folder,
      options?.quality
    );

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

export { cloudinary };
