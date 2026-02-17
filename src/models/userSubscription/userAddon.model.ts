import mongoose, { Document, Schema } from 'mongoose';

export interface IUserAddon extends Document {
    userId: mongoose.Types.ObjectId;
    addonId?: mongoose.Types.ObjectId;
    addonType: 'employee' | 'appointment' | 'spotPass' | 'visitor';
    quantity: number; // The logic: purchased unitQuantity * number of times bought
    paymentStatus: 'pending' | 'succeeded' | 'failed' | 'cancelled';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    isActive: boolean;
    source: 'system' | 'admin' | 'purchase';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const userAddonSchema = new Schema<IUserAddon>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        addonId: {
            type: Schema.Types.ObjectId,
            ref: 'SubscriptionAddon',
            required: false,
        },
        addonType: {
            type: String,
            enum: ['employee', 'appointment', 'spotPass', 'visitor'],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'succeeded', 'failed', 'cancelled'],
            default: 'pending',
        },
        razorpayOrderId: {
            type: String,
            index: true,
        },
        razorpayPaymentId: {
            type: String,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        source: {
            type: String,
            enum: ['system', 'admin', 'purchase'],
            default: 'purchase',
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export const UserAddon = mongoose.model<IUserAddon>(
    'UserAddon',
    userAddonSchema
);
