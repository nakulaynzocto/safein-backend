import { Router } from 'express';
import { VisitorController } from '../../controllers/visitor/visitor.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import { checkTrialLimits } from '../../middlewares/checkTrialLimits.middleware';
import {
    createVisitorValidation,
    updateVisitorValidation,
    visitorParamsValidation,
    getVisitorsValidation,
    bulkUpdateVisitorsValidation,
    visitorSearchValidation
} from '../../validations/visitor/visitor.validation';

const router = Router();

router.use(verifyToken);

router.post(
    '/',
    checkTrialLimits,
    validateRequest(createVisitorValidation),
    asyncWrapper(VisitorController.createVisitor)
);

router.get(
    '/',
    validateRequest(getVisitorsValidation),
    asyncWrapper(VisitorController.getAllVisitors)
);

router.get(
    '/stats',
    asyncWrapper(VisitorController.getVisitorStats)
);

router.post(
    '/search',
    validateRequest(visitorSearchValidation),
    asyncWrapper(VisitorController.searchVisitors)
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

router.put(
    '/bulk-update',
    validateRequest(bulkUpdateVisitorsValidation),
    asyncWrapper(VisitorController.bulkUpdateVisitors)
);

router.delete(
    '/:id',
    validateRequest(visitorParamsValidation),
    asyncWrapper(VisitorController.deleteVisitor)
);

export default router;
