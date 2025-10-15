import { Router } from 'express';
import { UserSubscriptionController } from '../../controllers/userSubscription/userSubscription.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import {
    createUserSubscriptionValidation,
    updateUserSubscriptionValidation,
    userSubscriptionParamsValidation,
    getUserSubscriptionsValidation,
    stripeCheckoutSessionValidation
} from '../../validations/userSubscription/userSubscription.validation';

const router = Router();

// Stripe webhook endpoint (no authentication required)
router.post(
    '/stripe/webhook',
    asyncWrapper(UserSubscriptionController.handleStripeWebhook)
);

// Protected routes (require authentication)
router.use(verifyToken);

// Assign free plan to new user
router.post(
    '/assign-free-plan',
    asyncWrapper(UserSubscriptionController.assignFreePlanToNewUser)
);

// Get user's active subscription
router.get(
    '/active/:userId',
    asyncWrapper(UserSubscriptionController.getUserActiveSubscription)
);

// Check if user has premium subscription
router.get(
    '/check-premium/:userId',
    asyncWrapper(UserSubscriptionController.checkPremiumSubscription)
);

// Create Stripe checkout session
router.post(
    '/stripe/checkout',
    validateRequest(stripeCheckoutSessionValidation),
    asyncWrapper(UserSubscriptionController.createCheckoutSession)
);

// Get all user subscriptions with pagination
router.get(
    '/',
    validateRequest(getUserSubscriptionsValidation),
    asyncWrapper(UserSubscriptionController.getAllUserSubscriptions)
);

// Get subscription statistics
router.get(
    '/stats',
    asyncWrapper(UserSubscriptionController.getSubscriptionStats)
);

// Process expired subscriptions (Admin only)
router.post(
    '/process-expired',
    asyncWrapper(UserSubscriptionController.processExpiredSubscriptions)
);

// Get user subscription by ID
router.get(
    '/:id',
    validateRequest(userSubscriptionParamsValidation),
    asyncWrapper(UserSubscriptionController.getUserSubscriptionById)
);

// Create user subscription
router.post(
    '/',
    validateRequest(createUserSubscriptionValidation),
    asyncWrapper(UserSubscriptionController.createUserSubscription)
);

// Update user subscription
router.put(
    '/:id',
    validateRequest(userSubscriptionParamsValidation),
    validateRequest(updateUserSubscriptionValidation),
    asyncWrapper(UserSubscriptionController.updateUserSubscription)
);

// Cancel user subscription
router.delete(
    '/:id',
    validateRequest(userSubscriptionParamsValidation),
    asyncWrapper(UserSubscriptionController.cancelUserSubscription)
);

export default router;

