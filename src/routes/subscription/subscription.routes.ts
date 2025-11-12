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

// Public routes (no authentication required)
// Get all subscription plans with pagination and filtering (for public access to pricing plans)
router.get(
    '/',
    validateRequest(getSubscriptionPlansValidation),
    asyncWrapper(SubscriptionPlanController.getAllSubscriptionPlans)
);

// Protected routes (require authentication)
router.use(verifyToken);

// Create subscription plan
router.post(
    '/',
    validateRequest(createSubscriptionPlanValidation),
    asyncWrapper(SubscriptionPlanController.createSubscriptionPlan)
);

// Get subscription plan statistics
router.get(
    '/stats',
    asyncWrapper(SubscriptionPlanController.getSubscriptionPlanStats)
);

// Get popular subscription plans
router.get(
    '/popular',
    asyncWrapper(SubscriptionPlanController.getPopularSubscriptionPlans)
);

// Get subscription plans by type
router.get(
    '/type/:planType',
    validateRequest(subscriptionPlanTypeParamsValidation),
    asyncWrapper(SubscriptionPlanController.getSubscriptionPlansByType)
);

// Get subscription plan by ID
router.get(
    '/:id',
    validateRequest(subscriptionPlanParamsValidation),
    asyncWrapper(SubscriptionPlanController.getSubscriptionPlanById)
);

// Update subscription plan
router.put(
    '/:id',
    validateRequest(subscriptionPlanParamsValidation),
    validateRequest(updateSubscriptionPlanValidation),
    asyncWrapper(SubscriptionPlanController.updateSubscriptionPlan)
);

// Soft delete subscription plan
router.delete(
    '/:id',
    validateRequest(subscriptionPlanParamsValidation),
    asyncWrapper(SubscriptionPlanController.deleteSubscriptionPlan)
);

// Restore subscription plan from trash
router.put(
    '/:id/restore',
    validateRequest(subscriptionPlanParamsValidation),
    asyncWrapper(SubscriptionPlanController.restoreSubscriptionPlan)
);

export default router;
