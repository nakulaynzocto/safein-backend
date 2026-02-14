import { Router } from 'express';

import { UploadController } from '../../controllers/upload/upload.controller';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import { verifyToken } from '../../middlewares/auth.middleware';
import { verifyAppointmentLinkToken } from '../../middlewares/appointmentLinkAuth.middleware';
import { UPLOAD_CONFIG } from '../../utils/cloudinary';
import { uploadLimiter, validateFileUpload, fileSizeLimit } from '../../middlewares/security';

const router = Router();

import { upload } from '../../middlewares/multer.middleware';

// Public route for appointment booking (requires appointment link token)
// Must be defined BEFORE authenticated routes to avoid JWT requirement
router.post(
  '/public',
  verifyAppointmentLinkToken,
  uploadLimiter,
  fileSizeLimit(UPLOAD_CONFIG.MAX_FILE_SIZE),
  upload.single('file'),
  validateFileUpload,
  asyncWrapper(UploadController.uploadFilePublic)
);

// Authenticated routes (require JWT token)
router.use(verifyToken);

router.post(
  '/',
  uploadLimiter,
  fileSizeLimit(UPLOAD_CONFIG.MAX_FILE_SIZE),
  upload.single('file'),
  validateFileUpload,
  asyncWrapper(UploadController.uploadFile)
);

router.post(
  '/multiple',
  uploadLimiter,
  fileSizeLimit(UPLOAD_CONFIG.MAX_FILE_SIZE * 10), // 10 files max
  upload.array('files', 10),
  validateFileUpload,
  asyncWrapper(UploadController.uploadMultipleFiles)
);

export default router;
