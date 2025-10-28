import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../../utils';
import { TryCatch } from '../../decorators';
import { UploadService } from '../../services/upload/upload.service';

/**
 * Upload Controller
 * Handles HTTP requests for file uploads
 */
export class UploadController {
  /**
   * Upload a single file to Cloudinary
   * POST /upload
   */
  @TryCatch('Failed to upload file')
  static async uploadFile(req: Request, res: Response, _next: NextFunction): Promise<void> {
    // Validate file exists
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    // Extract optional folder parameter
    const folder = req.body.folder;

    // Upload file
    const uploadResult = await UploadService.uploadFile(req.file, folder);
    
    ResponseUtil.success(res, 'File uploaded successfully', uploadResult);
  }

  /**
   * Upload multiple files to Cloudinary
   * POST /upload/multiple
   */
  @TryCatch('Failed to upload files')
  static async uploadMultipleFiles(req: Request, res: Response, _next: NextFunction): Promise<void> {
    // Validate files exist
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      throw new Error('No files uploaded');
    }

    // Handle both single array and multiple field uploads
    let files: Express.Multer.File[] = [];
    if (Array.isArray(req.files)) {
      files = req.files;
    } else {
      // Handle multiple field uploads
      files = Object.values(req.files).flat();
    }
    
    const folder = req.body.folder;

    // Upload files
    const uploadResults = await UploadService.uploadMultipleFiles(files, folder);
    
    ResponseUtil.success(
      res, 
      `${uploadResults.length} file(s) uploaded successfully`, 
      uploadResults
    );
  }
}
