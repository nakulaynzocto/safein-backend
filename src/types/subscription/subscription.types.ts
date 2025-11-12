import { Document } from 'mongoose';

export interface IMetadata {
    stripePriceId: string;
    stripeProductId: string;
}

export interface ISubscriptionPlan extends Document {
    name: string;
    description?: string;
    planType: 'free' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    amount: number; // in cents
    currency: string;
    features: string[];
    isActive: boolean;
    isPopular: boolean;
    trialDays?: number;
    sortOrder: number;
    metadata?: IMetadata;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateSubscriptionPlanDTO {
    name: string;
    description?: string;
    planType: 'free' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    amount: number;
    currency?: string;
    features: string[];
    isActive?: boolean;
    isPopular?: boolean;
    trialDays?: number;
    sortOrder?: number;
    metadata?: IMetadata;
}

export interface IUpdateSubscriptionPlanDTO {
    name?: string;
    description?: string;
    planType?: 'free' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    amount?: number;
    currency?: string;
    features?: string[];
    isActive?: boolean;
    isPopular?: boolean;
    trialDays?: number;
    sortOrder?: number;
    metadata?: IMetadata;
}

export interface ISubscriptionPlanResponse {
    _id: string;
    name: string;
    description?: string;
    planType: string;
    amount: number;
    currency: string;
    features: string[];
    isActive: boolean;
    isPopular: boolean;
    trialDays?: number;
    sortOrder: number;
    discountPercentage?: number;
    metadata?: IMetadata;
    formattedPrice: string;
    monthlyEquivalent: number;
    savingsPercentage: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IGetSubscriptionPlansQuery {
    page?: number;
    limit?: number;
    planType?: string;
    isActive?: boolean;
    isPopular?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ISubscriptionPlanListResponse {
    plans: ISubscriptionPlanResponse[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalPlans: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface ISubscriptionPlanStats {
    totalPlans: number;
    activePlans: number;
    popularPlans: number;
    plansByType: {
        free: number;
        weekly: number;
        monthly: number;
        quarterly: number;
        yearly: number;
    };
    averagePrice: number;
    totalRevenue: number;
}
