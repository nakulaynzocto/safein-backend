import { Router } from 'express';
import { SpotPassController } from '../../controllers/spotPass/spotPass.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import { checkSubscriptionStatus } from '../../middlewares/checkSubscriptionStatus.middleware';
import { userLimiter } from '../../middlewares';
import {
    createSpotPassValidation,
    getSpotPassesValidation,
    spotPassParamsValidation
} from '../../validations/spotPass/spotPass.validation';

const router = Router();

router.use(verifyToken);
router.use(userLimiter);

router.post(
    '/',
    checkSubscriptionStatus,
    validateRequest(createSpotPassValidation),
    asyncWrapper(SpotPassController.createSpotPass)
);

router.get(
    '/',
    validateRequest(getSpotPassesValidation),
    asyncWrapper(SpotPassController.getAllSpotPasses)
);

router.patch(
    '/:id/checkout',
    validateRequest(spotPassParamsValidation),
    asyncWrapper(SpotPassController.checkOutPass)
);

router.delete(
    '/:id',
    validateRequest(spotPassParamsValidation),
    asyncWrapper(SpotPassController.deletePass)
);

export default router;
