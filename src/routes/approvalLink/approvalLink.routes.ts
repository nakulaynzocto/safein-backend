import { Router } from 'express';
import { ApprovalLinkController } from '../../controllers/approvalLink/approvalLink.controller';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import { publicActionLimiter } from '../../middlewares';

const router = Router();

// Public routes - no authentication required
router.get(
    '/verify/:token',
    publicActionLimiter,
    asyncWrapper(ApprovalLinkController.verifyToken)
);

router.post(
    '/update-status',
    publicActionLimiter,
    asyncWrapper(ApprovalLinkController.updateStatus)
);

export default router;




