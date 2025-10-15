import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSubscription extends Document {
    userId: mongoose.Types.ObjectId; // Reference to User
    planId: mongoose.Types.ObjectId; // Reference to SubscriptionPlan
    status: 'active' | 'canceled' | 'expired' | 'pending' | 'past_due' | 'trialing';
    startDate: Date;
    endDate?: Date;
    trialEndDate?: Date;
    isAutoRenew: boolean;
    amount: number; // in cents
    currency: string;
    billingCycle: 'monthly' | 'quarterly' | 'yearly';

    // Stripe integration fields
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    stripePriceId?: string;
    stripePaymentMethodId?: string;
    stripeInvoiceId?: string;

    // Metadata for additional data
    metadata?: {
        [key: string]: any;
    };

    // Audit fields
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const userSubscriptionSchema = new Schema<IUserSubscription>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true
        },
        planId: {
            type: Schema.Types.ObjectId,
            ref: 'SubscriptionPlan',
            required: [true, 'Plan ID is required'],
            index: true
        },
        status: {
            type: String,
            enum: {
                values: ['active', 'canceled', 'expired', 'pending', 'past_due', 'trialing'],
                message: 'Status must be one of: active, canceled, expired, pending, past_due, trialing'
            },
            required: [true, 'Status is required'],
            default: 'pending',
            index: true
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
            default: Date.now
        },
        endDate: {
            type: Date,
            index: true
        },
        trialEndDate: {
            type: Date,
            index: true
        },
        isAutoRenew: {
            type: Boolean,
            default: true
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount cannot be negative']
        },
        currency: {
            type: String,
            required: [true, 'Currency is required'],
            default: 'usd',
            uppercase: true,
            length: [3, 'Currency must be a 3-letter code']
        },
        billingCycle: {
            type: String,
            enum: {
                values: ['monthly', 'quarterly', 'yearly'],
                message: 'Billing cycle must be one of: monthly, quarterly, yearly'
            },
            required: [true, 'Billing cycle is required']
        },

        // Stripe integration fields
        stripeSubscriptionId: {
            type: String,
            trim: true,
            sparse: true, // Allow null values but ensure uniqueness when present
            unique: true
        },
        stripeCustomerId: {
            type: String,
            trim: true,
            index: true
        },
        stripePriceId: {
            type: String,
            trim: true
        },
        stripePaymentMethodId: {
            type: String,
            trim: true
        },
        stripeInvoiceId: {
            type: String,
            trim: true
        },

        // Metadata
        metadata: {
            type: Schema.Types.Mixed,
            default: {}
        },

        // Audit fields
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        },
        deletedAt: {
            type: Date,
            default: null
        },
        deletedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Compound indexes for performance
userSubscriptionSchema.index({ userId: 1, status: 1 });
userSubscriptionSchema.index({ userId: 1, isDeleted: 1 });
userSubscriptionSchema.index({ planId: 1, status: 1 });
userSubscriptionSchema.index({ stripeCustomerId: 1, status: 1 });
userSubscriptionSchema.index({ endDate: 1, status: 1 });
userSubscriptionSchema.index({ createdAt: -1 });

// Virtual for formatted amount
userSubscriptionSchema.virtual('formattedAmount').get(function () {
    const amount = (this.amount / 100).toFixed(2);
    return `$${amount}`;
});

// Virtual for days remaining
userSubscriptionSchema.virtual('daysRemaining').get(function () {
    if (!this.endDate) return null;
    const now = new Date();
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is expired
userSubscriptionSchema.virtual('isExpired').get(function () {
    if (!this.endDate) return false;
    return new Date() > this.endDate;
});

// Virtual for is trialing
userSubscriptionSchema.virtual('isTrialing').get(function () {
    if (!this.trialEndDate) return false;
    return new Date() < this.trialEndDate && this.status === 'trialing';
});

// Method to check if subscription is active
userSubscriptionSchema.methods.isActive = function (): boolean {
    return this.status === 'active' && !this.isExpired;
};

// Method to check if subscription is premium (not free)
userSubscriptionSchema.methods.isPremium = function (): boolean {
    return this.amount > 0;
};

// Method to get next billing date
userSubscriptionSchema.methods.getNextBillingDate = function (): Date | null {
    if (!this.endDate || this.status !== 'active') return null;

    const nextBilling = new Date(this.endDate);
    switch (this.billingCycle) {
        case 'monthly':
            nextBilling.setMonth(nextBilling.getMonth() + 1);
            break;
        case 'quarterly':
            nextBilling.setMonth(nextBilling.getMonth() + 3);
            break;
        case 'yearly':
            nextBilling.setFullYear(nextBilling.getFullYear() + 1);
            break;
    }
    return nextBilling;
};

// Static method to find active subscriptions
userSubscriptionSchema.statics.findActive = function () {
    return this.find({
        status: 'active',
        isDeleted: false,
        $or: [
            { endDate: { $exists: false } },
            { endDate: { $gt: new Date() } }
        ]
    });
};

// Static method to find subscriptions by user
userSubscriptionSchema.statics.findByUser = function (userId: string) {
    return this.find({ userId, isDeleted: false }).sort({ createdAt: -1 });
};

// Static method to find active subscription by user
userSubscriptionSchema.statics.findActiveByUser = function (userId: string) {
    return this.findOne({
        userId,
        status: 'active',
        isDeleted: false,
        $or: [
            { endDate: { $exists: false } },
            { endDate: { $gt: new Date() } }
        ]
    });
};

// Static method to find expired subscriptions
userSubscriptionSchema.statics.findExpired = function () {
    return this.find({
        status: 'active',
        endDate: { $lt: new Date() },
        isDeleted: false
    });
};

// Instance method to soft delete
userSubscriptionSchema.methods.softDelete = function (deletedBy: mongoose.Types.ObjectId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

// Instance method to restore
userSubscriptionSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

// Instance method to cancel subscription
userSubscriptionSchema.methods.cancel = function () {
    this.status = 'canceled';
    this.isAutoRenew = false;
    return this.save();
};

// Instance method to expire subscription
userSubscriptionSchema.methods.expire = function () {
    this.status = 'expired';
    this.isAutoRenew = false;
    return this.save();
};

export const UserSubscription = mongoose.model<IUserSubscription>(
    'UserSubscription',
    userSubscriptionSchema
);

