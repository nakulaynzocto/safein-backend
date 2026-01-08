import { Router } from 'express';
import { InquiryController } from '../../controllers/inquiry/inquiry.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { inquiryValidation } from '../../validations';
import { supportInquiryLimiter } from '../../middlewares/security';
import { verifyMasterToken } from '../../middlewares/auth/masterToken.middleware';

const router = Router();
const controller = new InquiryController();

// Public route with rate limit
router.post(
    '/',
    supportInquiryLimiter,
    validateRequest(inquiryValidation.create),
    controller.createInquiry
);

// Protected routes (Internal/Super Admin)
router.get('/', verifyMasterToken, controller.getAllInquiries);
router.patch('/:id/status', verifyMasterToken, controller.updateInquiryStatus);
router.delete('/:id', verifyMasterToken, controller.deleteInquiry);

export default router;
