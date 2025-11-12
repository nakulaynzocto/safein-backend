import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSubscription extends Document {
    userId: mongoose.Types.ObjectId; // Reference to the User model
    planType: 'free' | 'monthly' | 'quarterly' | 'yearly';
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

const userSubscriptionSchema = new Schema<IUserSubscription>({
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        required: true,
    },
    planType: {
            type: String,
        enum: ['free', 'monthly', 'quarterly', 'yearly'],
        required: true,
        },
        startDate: {
            type: Date,
        required: true,
        },
        endDate: {
            type: Date,
        required: true,
    },
    isActive: {
            type: Boolean,
        default: true,
    },
    paymentStatus: {
            type: String,
        enum: ['pending', 'succeeded', 'failed', 'cancelled'],
        default: 'pending',
        },
        stripeCustomerId: {
            type: String,
        required: false, // Not required for free trials initially
        },
    stripeSubscriptionId: {
            type: String,
        required: false, // Only for paid recurring subscriptions
    },
    trialDays: {
        type: Number,
        default: 0,
    },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        default: null,
        },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        default: null,
    },
    },
    {
        timestamps: true,
});

export const UserSubscription = mongoose.model<IUserSubscription>('UserSubscription', userSubscriptionSchema);

