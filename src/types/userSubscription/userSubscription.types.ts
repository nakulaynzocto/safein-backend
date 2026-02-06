import mongoose, { Document } from 'mongoose';

export interface IUserSubscription extends Document {
    userId: mongoose.Types.ObjectId; // Reference to the User model
    planType: 'free' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    paymentStatus: 'pending' | 'succeeded' | 'failed' | 'cancelled';
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
    trialDays?: number;
    planId?: string;
}

export interface IUpdateUserSubscriptionDTO {
    planType?: 'free' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
    paymentStatus?: 'pending' | 'succeeded' | 'failed' | 'cancelled';
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
    trialDays: number;
    isTrialing: boolean; // Derived field
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    // Permission flags for frontend (calculated on backend for security)
    canAccessDashboard?: boolean;
    hasActiveSubscription?: boolean;
    subscriptionStatus?: 'active' | 'trialing' | 'cancelled' | 'expired' | 'pending';
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


export interface IGetUserActiveSubscriptionRequest {
    userId: string;
}


// Razorpay-only integration
export interface ITrialLimitsStatus {
    isTrial: boolean;
    planType: string;
    subscriptionStatus: string;
    isActive: boolean;
    isExpired: boolean;
    isEmployeeContext?: boolean;
    limits: {
        employees: {
            limit: number;
            current: number;
            reached: boolean;
            canCreate: boolean;
        };
        visitors: {
            limit: number;
            current: number;
            reached: boolean;
            canCreate: boolean;
        };
        appointments: {
            limit: number;
            current: number;
            reached: boolean;
            canCreate: boolean;
        };
    };
}

