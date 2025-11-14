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
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const folder = req.body.folder;

    const uploadResult = await UploadService.uploadFile(req.file, folder);
    
    ResponseUtil.success(res, 'File uploaded successfully', uploadResult);
  }

  /**
   * Upload multiple files to Cloudinary
   * POST /upload/multiple
   */
  @TryCatch('Failed to upload files')
  static async uploadMultipleFiles(req: Request, res: Response, _next: NextFunction): Promise<void> {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      throw new Error('No files uploaded');
    }

    let files: Express.Multer.File[] = [];
    if (Array.isArray(req.files)) {
      files = req.files;
    } else {
      files = Object.values(req.files).flat();
    }
    
    const folder = req.body.folder;

    const uploadResults = await UploadService.uploadMultipleFiles(files, folder);
    
    ResponseUtil.success(
      res, 
      `${uploadResults.length} file(s) uploaded successfully`, 
      uploadResults
    );
  }
}
