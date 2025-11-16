import { Router, Response, NextFunction, Request } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { ResponseUtil } from '../../utils';
import { StripeService } from '../../services/stripe/stripe.service';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// Setup Intent route (requires authentication)
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


export const webhookHandler = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const sig = req.headers['stripe-signature'] as string;
        
        if (!sig) {
            return ResponseUtil.error(res, 'Missing stripe-signature header', 400);
        }

        // Ensure body is Buffer (required for Stripe signature verification)
        const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
        
        await StripeService.handleWebhookEvent(payload, sig);
        
        return ResponseUtil.success(res, 'Webhook received', {}, 200);
    } catch (error: any) {
        console.error('Webhook error:', error);
        const errorMessage = error?.message || 'Webhook processing failed';
        return ResponseUtil.error(res, errorMessage, 400);
    }
});

// Webhook route - Note: This route requires express.raw() middleware
// which must be applied in app.ts before express.json()
// Route is registered here for documentation and organization
router.post('/webhook', webhookHandler);

export default router;
