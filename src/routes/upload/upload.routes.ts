import { Router } from 'express';
import multer = require('multer');
import { UploadController } from '../../controllers/upload/upload.controller';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import { verifyToken } from '../../middlewares/auth.middleware';
import { UPLOAD_CONFIG } from '../../utils/cloudinary';

const router = Router();

// Configure multer to handle file uploads with optimized settings
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for Cloudinary upload
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only image types
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed'));
    }
  }
});

// Protect all upload routes with authentication
router.use(verifyToken);

/**
 * @route   POST /api/v1/upload
 * @desc    Upload a single file
 * @access  Protected (requires authentication)
 * @body    folder (optional) - Custom folder name in Cloudinary
 */
router.post(
  '/', 
  upload.single('file'), 
  asyncWrapper(UploadController.uploadFile)
);

/**
 * @route   POST /api/v1/upload/multiple
 * @desc    Upload multiple files
 * @access  Protected (requires authentication)
 * @body    folder (optional) - Custom folder name in Cloudinary
 */
router.post(
  '/multiple',
  upload.array('files', 10), // Max 10 files
  asyncWrapper(UploadController.uploadMultipleFiles)
);

export default router;
