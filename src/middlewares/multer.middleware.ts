import multer from 'multer';
import { UPLOAD_CONFIG } from '../utils/cloudinary';

export const upload = multer({
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
