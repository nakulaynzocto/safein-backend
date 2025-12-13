import { Router } from 'express';
import express from 'express';
import { UserSubscriptionController } from '../../controllers/userSubscription/userSubscription.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncWrapper } from '../../middlewares/asyncWrapper';
import { webhookRawBodyMiddleware } from '../../middlewares/webhookRawBody.middleware';
import {
    createUserSubscriptionValidation,
    updateUserSubscriptionValidation,
    userSubscriptionParamsValidation,
    getUserSubscriptionsValidation,
    razorpayCheckoutValidation,
    razorpayVerifyValidation,
} from '../../validations/userSubscription/userSubscription.validation';

const router = Router();

// Webhook route - must be registered BEFORE express.json() in app.ts
// Export separately so it can be registered early in app.ts
export const webhookRouter = Router();
webhookRouter.post(
    '/',
    express.raw({ type: 'application/json' }),
    webhookRawBodyMiddleware,
    asyncWrapper(UserSubscriptionController.handleRazorpayWebhook)
);

router.use(verifyToken);

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
    validateRequest(razorpayCheckoutValidation),
    asyncWrapper(UserSubscriptionController.createRazorpayCheckout)
);

router.post(
    '/razorpay/verify',
    validateRequest(razorpayVerifyValidation),
    asyncWrapper(UserSubscriptionController.verifyRazorpayPayment)
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

