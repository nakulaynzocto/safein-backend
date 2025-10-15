import mongoose, { Document, Schema } from 'mongoose';

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
    deletedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
    {
        name: {
            type: String,
            required: [true, 'Plan name is required'],
            trim: true,
            maxlength: [100, 'Plan name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        planType: {
            type: String,
            enum: {
                values: ['free', 'weekly', 'monthly', 'quarterly', 'yearly'],
                message: 'Plan type must be one of: free, weekly, monthly, quarterly, yearly'
            },
            required: [true, 'Plan type is required'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        currency: {
            type: String,
            required: [true, 'Currency is required'],
            default: 'usd',
            lowercase: true,
            length: [3, 'Currency must be a 3-letter code'],
        },
        features: [
            {
                type: String,
                trim: true,
                maxlength: [200, 'Feature description cannot exceed 200 characters'],
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        isPopular: {
            type: Boolean,
            default: false,
        },
        trialDays: {
            type: Number,
            min: [0, 'Trial days cannot be negative'],
            max: [365, 'Trial days cannot exceed 365'],
            default: 0,
        },
        sortOrder: {
            type: Number,
            default: 0,
            min: [0, 'Sort order cannot be negative'],
        },
        metadata: {
            stripePriceId: {
                type: String,
                trim: true,
            },
            stripeProductId: {
                type: String,
                trim: true,
            },
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
        versionKey: false,
    }
);

// Indexes for performance
subscriptionPlanSchema.index({ isActive: 1, isDeleted: 1, sortOrder: 1 });
subscriptionPlanSchema.index({ planType: 1, isActive: 1 });
subscriptionPlanSchema.index({ amount: 1 });
subscriptionPlanSchema.index({ createdAt: -1 });
subscriptionPlanSchema.index({ isPopular: 1 });

// Virtual for formatted price
subscriptionPlanSchema.virtual('formattedPrice').get(function () {
    const price = (this.amount / 100).toFixed(2);
    return `$${price}`;
});

// Virtual for price per month (for yearly plans)
subscriptionPlanSchema.virtual('monthlyEquivalent').get(function () {
    if (this.planType === 'yearly') {
        const monthlyPrice = this.amount / 12;
        return Math.round(monthlyPrice);
    } else if (this.planType === 'quarterly') {
        const monthlyPrice = this.amount / 3;
        return Math.round(monthlyPrice);
    }
    return this.amount;
});

// Virtual for savings percentage (for yearly plans)
subscriptionPlanSchema.virtual('savingsPercentage').get(function () {
    if (this.planType === 'yearly') {
        // This would need to be compared with monthly plan in real implementation
        return 20; // Default 20% savings for yearly
    } else if (this.planType === 'quarterly') {
        return 10; // Default 10% savings for quarterly
    }
    return 0;
});

// Method to check if plan has trial
subscriptionPlanSchema.methods.hasTrial = function (): boolean {
    return this.trialDays && this.trialDays > 0;
};

// Method to get formatted features
subscriptionPlanSchema.methods.getFormattedFeatures = function (): string[] {
    return this.features.map((feature: string) => `✓ ${feature}`);
};

// Static method to find active plans
subscriptionPlanSchema.statics.findActive = function () {
    return this.find({ isDeleted: false, isActive: true }).sort({ sortOrder: 1 });
};

// Static method to find popular plans
subscriptionPlanSchema.statics.findPopular = function () {
    return this.find({ isDeleted: false, isActive: true, isPopular: true }).sort({ sortOrder: 1 });
};

// Static method to find plans by type
subscriptionPlanSchema.statics.findByType = function (planType: string) {
    return this.find({ planType, isDeleted: false, isActive: true }).sort({ sortOrder: 1 });
};

// Instance method to soft delete
subscriptionPlanSchema.methods.softDelete = function (deletedBy: mongoose.Types.ObjectId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

// Instance method to restore
subscriptionPlanSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
};

export const SubscriptionPlan = mongoose.model<ISubscriptionPlan>(
    'SubscriptionPlan',
    subscriptionPlanSchema
);
