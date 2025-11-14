import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { ResponseUtil } from '../../utils';
import { StripeService } from '../../services/stripe/stripe.service';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.post(
    '/create-setup-intent',
    asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
        if (!req.user || !req.user.stripeCustomerId) {
            return ResponseUtil.error(res, 'User or Stripe customer ID not found', 400);
        }

        const setupIntent = await StripeService.createPaymentMethodSetupIntent(req.user.stripeCustomerId);
        return ResponseUtil.success(res, 'Setup Intent created successfully', { clientSecret: setupIntent.client_secret });
    })
);

router.post(
    '/webhook',
    asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
        const sig = req.headers['stripe-signature'] as string;
        await StripeService.handleWebhookEvent(req.body, sig);
        return ResponseUtil.success(res, 'Webhook received', {}, 200);
    })
);

export default router;
