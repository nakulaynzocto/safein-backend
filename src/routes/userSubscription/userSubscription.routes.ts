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

router.post(
    '/stripe/webhook',
    asyncWrapper(UserSubscriptionController.handleStripeWebhook)
);

router.use(verifyToken);

router.post(
    '/assign-free-plan',
    asyncWrapper(UserSubscriptionController.assignFreePlanToNewUser)
);

router.post(
    '/stripe/checkout-free',
    asyncWrapper(UserSubscriptionController.createFreePlanVerificationSession)
);

router.get(
    '/active/:userId',
    asyncWrapper(UserSubscriptionController.getUserActiveSubscription)
);

router.get(
    '/check-premium/:userId',
    asyncWrapper(UserSubscriptionController.checkPremiumSubscription)
);

router.get(
    '/trial-limits',
    asyncWrapper(UserSubscriptionController.getTrialLimitsStatus)
);

router.post(
    '/razorpay/checkout',
    validateRequest(stripeCheckoutSessionValidation),
    asyncWrapper(UserSubscriptionController.createRazorpayCheckout)
);

router.get(
    '/',
    validateRequest(getUserSubscriptionsValidation),
    asyncWrapper(UserSubscriptionController.getAllUserSubscriptions)
);

router.get(
    '/stats',
    asyncWrapper(UserSubscriptionController.getSubscriptionStats)
);

router.post(
    '/process-expired',
    asyncWrapper(UserSubscriptionController.processExpiredSubscriptions)
);

router.get(
    '/:id',
    validateRequest(userSubscriptionParamsValidation),
    asyncWrapper(UserSubscriptionController.getUserSubscriptionById)
);

router.post(
    '/',
    validateRequest(createUserSubscriptionValidation),
    asyncWrapper(UserSubscriptionController.createUserSubscription)
);

router.put(
    '/:id',
    validateRequest(userSubscriptionParamsValidation),
    validateRequest(updateUserSubscriptionValidation),
    asyncWrapper(UserSubscriptionController.updateUserSubscription)
);

router.delete(
    '/:id',
    validateRequest(userSubscriptionParamsValidation),
    asyncWrapper(UserSubscriptionController.cancelUserSubscription)
);

export default router;

