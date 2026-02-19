import mongoose, { Document, Schema } from 'mongoose';

export interface IMetadata {
    stripePriceId: string;
    stripeProductId: string;
}

export interface ISubscriptionPlan extends Document {
    name: string;
    description?: string;
    planType: 'free' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    amount: number; // in rupees (INR)
    taxPercentage: number; // GST/Tax in percentage
    currency: string;
    features: string[];
    isActive: boolean;
    isPopular: boolean;
    isPublic: boolean; // true = public, false = super admin only
    trialDays?: number;
    sortOrder: number;
    discountPercentage?: number;
    metadata?: IMetadata;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    limits: {
        employees: number;
        visitors: number;
        appointments: number;
        spotPasses: number;
    };
    modules: {
        visitorInvite: boolean;
        message: boolean;
    };
    // Virtuals
    totalAmount: number;
    formattedPrice: string;
    duration: number;
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
        taxPercentage: {
            type: Number,
            default: 0,
            min: [0, 'Tax percentage cannot be negative'],
            max: [100, 'Tax percentage cannot exceed 100'],
        },
        currency: {
            type: String,
            required: [true, 'Currency is required'],
            default: 'inr',
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
        isPublic: {
            type: Boolean,
            default: true, // true = visible to all, false = super admin only
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
        limits: {
            employees: {
                type: Number,
                default: -1,
            },
            visitors: {
                type: Number,
                default: -1,
            },
            appointments: {
                type: Number,
                default: -1,
            },
            spotPasses: {
                type: Number,
                default: 0,
            },
        },
        modules: {
            visitorInvite: {
                type: Boolean,
                default: false,
            },
            message: {
                type: Boolean,
                default: false,
            },
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

subscriptionPlanSchema.index({ isActive: 1, isDeleted: 1, sortOrder: 1 });
subscriptionPlanSchema.index({ planType: 1, isActive: 1 });
subscriptionPlanSchema.index({ amount: 1 });
subscriptionPlanSchema.index({ createdAt: -1 });
subscriptionPlanSchema.index({ isPopular: 1 });

subscriptionPlanSchema.virtual('formattedPrice').get(function () {
    const price = typeof this.amount === 'number' ? this.amount.toFixed(2) : '0.00';
    return `₹${price}`;
});

subscriptionPlanSchema.virtual('monthlyEquivalent').get(function () {
    const amount = this.amount || 0;
    if (this.planType === 'yearly') {
        const monthlyPrice = amount / 12;
        return Math.round(monthlyPrice);
    } else if (this.planType === 'quarterly') {
        const monthlyPrice = amount / 3;
        return Math.round(monthlyPrice);
    }
    return amount;
});

subscriptionPlanSchema.virtual('savingsPercentage').get(function () {
    if (this.planType === 'yearly') {
        return 20;
    } else if (this.planType === 'quarterly') {
        return 10;
    }
    return 0;
});

subscriptionPlanSchema.virtual('totalAmount').get(function () {
    const amount = this.amount || 0;
    const tax = this.taxPercentage || 0;
    const total = amount + (amount * tax) / 100;
    return Math.round(total);
});

subscriptionPlanSchema.virtual('duration').get(function () {
    switch (this.planType) {
        case 'weekly':
            return 7;
        case 'monthly':
            return 30;
        case 'quarterly':
            return 90;
        case 'yearly':
            return 365;
        case 'free':
        default:
            return 30; // default to 30 days
    }
});

subscriptionPlanSchema.methods.hasTrial = function (): boolean {
    return this.trialDays && this.trialDays > 0;
};

subscriptionPlanSchema.methods.getFormattedFeatures = function (): string[] {
    return this.features.map((feature: string) => `✓ ${feature}`);
};

subscriptionPlanSchema.statics.findActive = function () {
    return this.find({ isDeleted: false, isActive: true }).sort({ sortOrder: 1 });
};

subscriptionPlanSchema.statics.findPopular = function () {
    return this.find({ isDeleted: false, isActive: true, isPopular: true }).sort({ sortOrder: 1 });
};

subscriptionPlanSchema.statics.findByType = function (planType: string) {
    return this.find({ planType, isDeleted: false, isActive: true }).sort({ sortOrder: 1 });
};

subscriptionPlanSchema.methods.softDelete = function (deletedBy: mongoose.Types.ObjectId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
};

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
