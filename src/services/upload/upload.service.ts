import { AppError } from '../../middlewares/errorHandler';
import { uploadToCloudinary, UPLOAD_CONFIG } from '../../utils/cloudinary';
import { ERROR_CODES } from '../../utils/constants';
import sharp from 'sharp';

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
   * Compress image if it's larger than 400KB
   * @param file - Uploaded file object
   * @returns Compressed file buffer or original buffer
   */
  private static async compressImage(file: Express.Multer.File): Promise<Buffer> {
    const maxSizeKB = 400;
    const maxSizeBytes = maxSizeKB * 1024;

    // If file is already smaller than 400KB, return as is
    if (file.size <= maxSizeBytes) {
      return file.buffer;
    }

    // Skip compression for SVG files
    if (file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg')) {
      return file.buffer;
    }

    try {
      let compressedBuffer = file.buffer;
      let quality = 90;
      const minQuality = 10;

      // Try to compress with decreasing quality until we reach target size
      while (compressedBuffer.length > maxSizeBytes && quality >= minQuality) {
        const sharpInstance = sharp(file.buffer);

        // Resize if image is too large (max 1920px on longest side)
        sharpInstance.resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        });

        // Compress based on image type
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
          compressedBuffer = await sharpInstance
            .jpeg({ quality, progressive: true, mozjpeg: true })
            .toBuffer();
        } else if (file.mimetype === 'image/png') {
          compressedBuffer = await sharpInstance
            .png({ quality, compressionLevel: 9 })
            .toBuffer();
        } else if (file.mimetype === 'image/webp') {
          compressedBuffer = await sharpInstance
            .webp({ quality })
            .toBuffer();
        } else {
          // For other formats, convert to JPEG
          compressedBuffer = await sharpInstance
            .jpeg({ quality, progressive: true })
            .toBuffer();
        }

        // If still too large, reduce quality
        if (compressedBuffer.length > maxSizeBytes && quality > minQuality) {
          quality -= 10;
        } else {
          break;
        }
      }

      const originalSizeKB = (file.size / 1024).toFixed(2);
      const compressedSizeKB = (compressedBuffer.length / 1024).toFixed(2);
      console.log(`Image compressed: ${file.originalname} from ${originalSizeKB}KB to ${compressedSizeKB}KB`);

      return compressedBuffer;
    } catch (error: any) {
      console.warn(`Compression failed for ${file.originalname}, using original:`, error.message);
      // Return original buffer if compression fails
      return file.buffer;
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

    // Compress image if it's larger than 400KB
    const compressedBuffer = await this.compressImage(file);
    
    // Create a new file object with compressed buffer
    const compressedFile: Express.Multer.File = {
      ...file,
      buffer: compressedBuffer,
      size: compressedBuffer.length
    };

    const result = await uploadToCloudinary(compressedFile, {
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
