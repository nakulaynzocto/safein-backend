import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSubscription extends Document {
    userId: mongoose.Types.ObjectId; // Reference to the User model
    planType: 'free' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    paymentStatus: 'pending' | 'succeeded' | 'failed' | 'cancelled';
    trialDays?: number; // Number of trial days, if applicable
    razorpayOrderId?: string; // Razorpay order ID for tracking
    razorpayPaymentId?: string; // Razorpay payment ID for idempotency
    isDeleted: boolean; // For soft deletion
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId; // User who deleted this subscription
    source: 'self' | 'admin' | 'system';
    assignedBy?: mongoose.Types.ObjectId;
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
        enum: ['free', 'weekly', 'monthly', 'quarterly', 'yearly'],
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
    trialDays: {
        type: Number,
        default: 0,
    },
    razorpayOrderId: {
        type: String,
        default: null,
        index: true, // Index for faster lookups
    },
    razorpayPaymentId: {
        type: String,
        default: null,
        index: true, // Index for faster lookups and idempotency
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
    source: {
        type: String,
        enum: ['self', 'admin', 'system'],
        default: 'self',
    },
    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
},
    {
        timestamps: true,
    });

export const UserSubscription = mongoose.model<IUserSubscription>('UserSubscription', userSubscriptionSchema);

