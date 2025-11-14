import { AppError } from '../../middlewares/errorHandler';
import { uploadToCloudinary, UPLOAD_CONFIG } from '../../utils/cloudinary';
import { ERROR_CODES } from '../../utils/constants';

/**
 * Upload Service
 * Handles file validation and uploading to Cloudinary with optimization
 */
export class UploadService {
  /**
   * Validate uploaded file type and size
   * @param file - Uploaded file object
   * @throws AppError if validation fails
   */
  static validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new AppError('No file uploaded', ERROR_CODES.BAD_REQUEST);
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new AppError(
        'Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP)',
        ERROR_CODES.BAD_REQUEST
      );
    }

    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      const maxSizeMB = UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
      throw new AppError(
        `File size exceeds ${maxSizeMB}MB limit`,
        ERROR_CODES.BAD_REQUEST
      );
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new AppError('File buffer is empty', ERROR_CODES.BAD_REQUEST);
    }
  }

  /**
   * Get file metadata for logging
   * @param file - Uploaded file object
   * @returns File metadata
   */
  static getFileMetadata(file: Express.Multer.File) {
    return {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    };
  }

  /**
   * Upload file to Cloudinary with optimization
   * @param file - Uploaded file object
   * @param customFolder - Optional custom folder name
   * @returns Upload result with URL and metadata
   */
  static async uploadFile(
    file: Express.Multer.File,
    customFolder?: string
  ): Promise<{ 
    url: string; 
    filename: string; 
    size: number;
  }> {
    this.validateFile(file);

    const result = await uploadToCloudinary(file, {
      folder: customFolder || UPLOAD_CONFIG.UPLOAD_FOLDER
    });

    if (!result.success || !result.data) {
      throw new AppError(
        result.message || 'Failed to upload file to Cloudinary',
        ERROR_CODES.INTERNAL_SERVER_ERROR
      );
    }

    return result.data;
  }

  /**
   * Upload multiple files
   * @param files - Array of uploaded files
   * @param customFolder - Optional custom folder name
   * @returns Array of upload results
   */
  static async uploadMultipleFiles(
    files: Express.Multer.File[],
    customFolder?: string
  ): Promise<{ url: string; filename: string; size: number }[]> {
    const results = await Promise.allSettled(
      files.map(file => this.uploadFile(file, customFolder))
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      console.error(`${failures.length} file(s) failed to upload`);
    }

    return successful;
  }
}
