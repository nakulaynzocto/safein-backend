import mongoose, { Document } from 'mongoose';

export interface IUserSubscription extends Document {
    userId: mongoose.Types.ObjectId; // Reference to the User model
    planType: 'free' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    paymentStatus: 'pending' | 'succeeded' | 'failed' | 'cancelled';
    stripeCustomerId?: string; // Stripe Customer ID associated with the user
    stripeSubscriptionId?: string; // Stripe Subscription ID for recurring payments
    trialDays?: number; // Number of trial days, if applicable
    isDeleted: boolean; // For soft deletion
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId; // User who deleted this subscription
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateUserSubscriptionDTO {
    userId: string; // Will be converted to ObjectId in service
    planType: 'free' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
    paymentStatus?: 'pending' | 'succeeded' | 'failed' | 'cancelled';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    trialDays?: number;
}

export interface IUpdateUserSubscriptionDTO {
    planType?: 'free' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
    paymentStatus?: 'pending' | 'succeeded' | 'failed' | 'cancelled';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    trialDays?: number;
    isDeleted?: boolean;
    deletedAt?: Date;
    deletedBy?: string; // Will be converted to ObjectId in service
}

export interface IUserSubscriptionResponse {
    _id: string;
    userId: string;
    planType: 'free' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    paymentStatus: 'pending' | 'succeeded' | 'failed' | 'cancelled';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    trialDays: number;
    isTrialing: boolean; // Derived field
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IGetUserSubscriptionsQuery {
    page?: number;
    limit?: number;
    status?: string; // paymentStatus
    userId?: string;
    planType?: 'free' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'; // Use planType instead of planId
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

export interface IAssignFreePlanRequest {
    userId: string;
    stripeCustomerId?: string;
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

