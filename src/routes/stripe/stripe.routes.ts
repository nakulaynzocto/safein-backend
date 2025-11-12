import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { ResponseUtil } from '../../utils';
import { StripeService } from '../../services/stripe/stripe.service';
import { asyncHandler } from '../../utils/asyncHandler'; // Import the new asyncHandler utility

const router = Router();

// Route to create a setup intent for payment method verification
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

// Route for Stripe webhooks
router.post(
    '/webhook',
    // This route needs the raw body, so it's handled in app.ts with specific middleware.
    // Here we just pass it to the service.
    asyncHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
        const sig = req.headers['stripe-signature'] as string;
        await StripeService.handleWebhookEvent(req.body, sig);
        return ResponseUtil.success(res, 'Webhook received', {}, 200);
    })
);

export default router;
