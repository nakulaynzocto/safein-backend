import Stripe from 'stripe';
import { CONSTANTS } from "../utils/constants";

export const stripe = new Stripe(CONSTANTS.STRIPE_SECRET_KEY as string, {
    // apiVersion: '2023-10-16', // Removed as it caused a type error
    typescript: true,
});
