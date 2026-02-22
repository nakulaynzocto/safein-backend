import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionAddon extends Document {
    name: string;
    description: string;
    type: 'employee' | 'appointment' | 'spotPass';
    unitQuantity: number; // How many units are added (e.g., 10 employees)
    amount: number; // Price in INR
    currency: string;
    isActive: boolean;
    isPublic: boolean;
    sortOrder: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const subscriptionAddonSchema = new Schema<ISubscriptionAddon>(
    {
        name: {
            type: String,
            required: [true, 'Addon name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: ['employee', 'appointment', 'spotPass'],
            required: [true, 'Addon type is required'],
        },
        unitQuantity: {
            type: Number,
            required: [true, 'Unit quantity is required'],
            min: [1, 'Quantity must be at least 1'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        currency: {
            type: String,
            default: 'inr',
            lowercase: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const SubscriptionAddon = mongoose.model<ISubscriptionAddon>(
    'SubscriptionAddon',
    subscriptionAddonSchema
);
