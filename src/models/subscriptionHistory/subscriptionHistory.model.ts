import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionHistory extends Document {
    userId: mongoose.Types.ObjectId; // Reference to the User model
    subscriptionId: mongoose.Types.ObjectId; // Reference to the UserSubscription model
    planType: 'free' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'addon';
    planId?: mongoose.Types.ObjectId; // Reference to SubscriptionPlan (if available)
    addonId?: mongoose.Types.ObjectId; // Reference to SubscriptionAddon (if available)
    invoiceNumber?: string; // Generated invoice number with dynamic date formatting
    purchaseDate: Date; // When the plan was purchased
    startDate: Date; // When the subscription started
    endDate: Date; // When the subscription ends/ended
    amount?: number; // Amount paid (in paise/cents)
    currency?: string; // Currency code
    paymentStatus: 'pending' | 'succeeded' | 'failed' | 'cancelled';
    razorpayOrderId?: string; // Razorpay order ID
    razorpayPaymentId?: string; // Razorpay payment ID
    previousSubscriptionId?: mongoose.Types.ObjectId; // Reference to previous subscription (if upgraded)
    remainingDaysFromPrevious?: number; // Days carried forward from previous subscription
    source?: 'user' | 'admin' | 'system'; // Who initiated the subscription
    taxAmount?: number; // Tax amount included in the total
    taxPercentage?: number; // Tax percentage applied
    taxSplit?: any; // Pre-calculated GST split (CGST/SGST/IGST)
    amountInWords?: string; // Amount converted to words
    billingDetails?: any; // Flexible structure
    isDeleted: boolean; // For soft deletion
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const subscriptionHistorySchema = new Schema<ISubscriptionHistory>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        subscriptionId: {
            type: Schema.Types.ObjectId,
            ref: 'UserSubscription',
            required: true,
            index: true,
        },
        planType: {
            type: String,
            enum: ['free', 'weekly', 'monthly', 'quarterly', 'yearly', 'addon'],
            required: true,
        },
        planId: {
            type: Schema.Types.ObjectId,
            ref: 'SubscriptionPlan',
            default: null,
        },
        addonId: {
            type: Schema.Types.ObjectId,
            ref: 'SubscriptionAddon',
            default: null,
        },
        invoiceNumber: {
            type: String,
            default: null,
        },
        purchaseDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        amount: {
            type: Number,
            default: null,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'succeeded', 'failed', 'cancelled'],
            default: 'pending',
        },
        razorpayOrderId: {
            type: String,
            default: null,
            index: true,
        },
        razorpayPaymentId: {
            type: String,
            default: null,
        },
        previousSubscriptionId: {
            type: Schema.Types.ObjectId,
            ref: 'UserSubscription',
            default: null,
        },
        remainingDaysFromPrevious: {
            type: Number,
            default: 0,
        },
        source: {
            type: String,
            enum: ['user', 'admin', 'system'],
            default: 'user', // Default to user for backward compatibility
        },
        taxAmount: {
            type: Number,
            default: 0,
        },
        taxPercentage: {
            type: Number,
            default: 0,
        },
        taxSplit: {
            type: Schema.Types.Mixed,
            default: null,
        },
        amountInWords: {
            type: String,
            default: null,
        },
        billingDetails: {
            type: Schema.Types.Mixed, // Allow flexible structure to avoid validation errors
            default: {}
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
subscriptionHistorySchema.index({ userId: 1, isDeleted: 1, purchaseDate: -1 });
subscriptionHistorySchema.index({ razorpayPaymentId: 1 });

export const SubscriptionHistory = mongoose.model<ISubscriptionHistory>(
    'SubscriptionHistory',
    subscriptionHistorySchema
);


