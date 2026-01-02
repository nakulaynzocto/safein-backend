import { Router } from 'express';
import { VisitorController } from '../../controllers/visitor/visitor.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import { checkSubscriptionStatus } from '../../middlewares/checkSubscriptionStatus.middleware';
import { userLimiter } from '../../middlewares';
import {
    createVisitorValidation,
    updateVisitorValidation,
    visitorParamsValidation,
    getVisitorsValidation
} from '../../validations/visitor/visitor.validation';

const router = Router();

router.use(verifyToken);
router.use(userLimiter);

router.post(
    '/',
    checkSubscriptionStatus,
    validateRequest(createVisitorValidation),
    asyncWrapper(VisitorController.createVisitor)
);

router.get(
    '/',
    validateRequest(getVisitorsValidation),
    asyncWrapper(VisitorController.getAllVisitors)
);





router.get(
    '/:id/has-appointments',
    validateRequest(visitorParamsValidation),
    asyncWrapper(VisitorController.hasAppointments)
);

router.get(
    '/:id',
    validateRequest(visitorParamsValidation),
    asyncWrapper(VisitorController.getVisitorById)
);

router.put(
    '/:id',
    validateRequest(visitorParamsValidation),
    validateRequest(updateVisitorValidation),
    asyncWrapper(VisitorController.updateVisitor)
);



router.delete(
    '/:id',
    validateRequest(visitorParamsValidation),
    asyncWrapper(VisitorController.deleteVisitor)
);

export default router;
