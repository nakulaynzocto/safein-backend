import { Router } from 'express';
import multer = require('multer');
import { UploadController } from '../../controllers/upload/upload.controller';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import { verifyToken } from '../../middlewares/auth.middleware';
import { UPLOAD_CONFIG } from '../../utils/cloudinary';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed'));
    }
  }
});

router.use(verifyToken);

router.post(
  '/', 
  upload.single('file'), 
  asyncWrapper(UploadController.uploadFile)
);

router.post(
  '/multiple',
  upload.array('files', 10),
  asyncWrapper(UploadController.uploadMultipleFiles)
);

export default router;
