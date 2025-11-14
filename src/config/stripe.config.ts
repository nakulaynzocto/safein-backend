import Stripe from 'stripe';
import { CONSTANTS } from "../utils/constants";

export const stripe = new Stripe(CONSTANTS.STRIPE_SECRET_KEY as string, {
    typescript: true,
});
