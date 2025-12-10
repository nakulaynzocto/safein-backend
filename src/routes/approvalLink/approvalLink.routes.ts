import { Router } from 'express';
import { ApprovalLinkController } from '../../controllers/approvalLink/approvalLink.controller';
import { asyncWrapper } from '../../middlewares/asyncWrapper';

const router = Router();

// Public routes - no authentication required
router.get(
    '/verify/:token',
    asyncWrapper(ApprovalLinkController.verifyToken)
);

router.post(
    '/update-status',
    asyncWrapper(ApprovalLinkController.updateStatus)
);

export default router;




