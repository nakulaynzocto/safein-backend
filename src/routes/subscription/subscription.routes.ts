import { Router } from 'express';
import { SubscriptionPlanController } from '../../controllers/subscription/subscription.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import {
    createSubscriptionPlanValidation,
    updateSubscriptionPlanValidation,
    subscriptionPlanParamsValidation,
    subscriptionPlanTypeParamsValidation,
    getSubscriptionPlansValidation
} from '../../validations/subscription/subscription.validation';

const router = Router();

router.get(
    '/',
    validateRequest(getSubscriptionPlansValidation),
    asyncWrapper(SubscriptionPlanController.getAllSubscriptionPlans)
);

router.use(verifyToken);

router.post(
    '/',
    validateRequest(createSubscriptionPlanValidation),
    asyncWrapper(SubscriptionPlanController.createSubscriptionPlan)
);

router.get(
    '/stats',
    asyncWrapper(SubscriptionPlanController.getSubscriptionPlanStats)
);

router.get(
    '/popular',
    asyncWrapper(SubscriptionPlanController.getPopularSubscriptionPlans)
);

router.get(
    '/type/:planType',
    validateRequest(subscriptionPlanTypeParamsValidation),
    asyncWrapper(SubscriptionPlanController.getSubscriptionPlansByType)
);

router.get(
    '/:id',
    validateRequest(subscriptionPlanParamsValidation),
    asyncWrapper(SubscriptionPlanController.getSubscriptionPlanById)
);

router.put(
    '/:id',
    validateRequest(subscriptionPlanParamsValidation),
    validateRequest(updateSubscriptionPlanValidation),
    asyncWrapper(SubscriptionPlanController.updateSubscriptionPlan)
);

router.delete(
    '/:id',
    validateRequest(subscriptionPlanParamsValidation),
    asyncWrapper(SubscriptionPlanController.deleteSubscriptionPlan)
);

router.put(
    '/:id/restore',
    validateRequest(subscriptionPlanParamsValidation),
    asyncWrapper(SubscriptionPlanController.restoreSubscriptionPlan)
);

export default router;
