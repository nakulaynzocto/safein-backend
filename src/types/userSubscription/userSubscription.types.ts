import { Document } from 'mongoose';

export interface IUserSubscription extends Document {
    userId: string;
    planId: string;
    status: 'active' | 'canceled' | 'expired' | 'pending' | 'past_due' | 'trialing';
    startDate: Date;
    endDate?: Date;
    trialEndDate?: Date;
    isAutoRenew: boolean;
    amount: number;
    currency: string;
    billingCycle: 'monthly' | 'quarterly' | 'yearly';
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    stripePriceId?: string;
    stripePaymentMethodId?: string;
    stripeInvoiceId?: string;
    metadata?: { [key: string]: any };
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateUserSubscriptionDTO {
    userId: string;
    planId: string;
    status?: 'active' | 'canceled' | 'expired' | 'pending' | 'past_due' | 'trialing';
    startDate?: Date;
    endDate?: Date;
    trialEndDate?: Date;
    isAutoRenew?: boolean;
    amount: number;
    currency?: string;
    billingCycle: 'monthly' | 'quarterly' | 'yearly';
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    stripePriceId?: string;
    stripePaymentMethodId?: string;
    stripeInvoiceId?: string;
    metadata?: { [key: string]: any };
}

export interface IUpdateUserSubscriptionDTO {
    status?: 'active' | 'canceled' | 'expired' | 'pending' | 'past_due' | 'trialing';
    endDate?: Date;
    trialEndDate?: Date;
    isAutoRenew?: boolean;
    amount?: number;
    currency?: string;
    billingCycle?: 'monthly' | 'quarterly' | 'yearly';
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    stripePriceId?: string;
    stripePaymentMethodId?: string;
    stripeInvoiceId?: string;
    metadata?: { [key: string]: any };
}

export interface IUserSubscriptionResponse {
    _id: string;
    userId: string;
    planId: string;
    status: string;
    startDate: Date;
    endDate?: Date;
    trialEndDate?: Date;
    isAutoRenew: boolean;
    amount: number;
    currency: string;
    billingCycle: string;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    stripePriceId?: string;
    stripePaymentMethodId?: string;
    stripeInvoiceId?: string;
    metadata?: { [key: string]: any };
    formattedAmount: string;
    daysRemaining?: number;
    isExpired: boolean;
    isTrialing: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IGetUserSubscriptionsQuery {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    planId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface IUserSubscriptionListResponse {
    subscriptions: IUserSubscriptionResponse[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalSubscriptions: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface IUserSubscriptionStats {
    totalSubscriptions: number;
    activeSubscriptions: number;
    canceledSubscriptions: number;
    expiredSubscriptions: number;
    trialingSubscriptions: number;
    subscriptionsByStatus: {
        active: number;
        canceled: number;
        expired: number;
        pending: number;
        past_due: number;
        trialing: number;
    };
    totalRevenue: number;
    averageSubscriptionValue: number;
}

// Stripe-related types
export interface IStripeCheckoutSessionRequest {
    planId: string;
    successUrl?: string;
    cancelUrl?: string;
    customerEmail?: string;
}

export interface IStripeCheckoutSessionResponse {
    sessionId: string;
    url: string;
}

export interface IStripeWebhookEvent {
    id: string;
    type: string;
    data: {
        object: any;
    };
    created: number;
}

export interface IStripeCustomer {
    id: string;
    email: string;
    name?: string;
    metadata?: { [key: string]: string };
}

export interface IStripeSubscription {
    id: string;
    customer: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    trial_start?: number;
    trial_end?: number;
    cancel_at_period_end: boolean;
    items: {
        data: Array<{
            price: {
                id: string;
                unit_amount: number;
                currency: string;
                recurring: {
                    interval: string;
                };
            };
        }>;
    };
    metadata?: { [key: string]: string };
}

export interface IStripePrice {
    id: string;
    product: string;
    unit_amount: number;
    currency: string;
    recurring?: {
        interval: string;
        interval_count: number;
    };
    metadata?: { [key: string]: string };
}

export interface IStripeProduct {
    id: string;
    name: string;
    description?: string;
    metadata?: { [key: string]: string };
}

// Service method types
export interface IAssignFreePlanRequest {
    userId: string;
}

export interface IGetUserActiveSubscriptionRequest {
    userId: string;
}

export interface ICheckPremiumSubscriptionRequest {
    userId: string;
}

export interface ICreateStripeCustomerRequest {
    email: string;
    name?: string;
    metadata?: { [key: string]: string };
}

export interface IUpdateStripeCustomerRequest {
    customerId: string;
    email?: string;
    name?: string;
    metadata?: { [key: string]: string };
}

