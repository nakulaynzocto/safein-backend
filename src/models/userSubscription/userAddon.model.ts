import mongoose, { Document, Schema } from 'mongoose';

export interface IUserAddon extends Document {
    userId: mongoose.Types.ObjectId;
    addonId: mongoose.Types.ObjectId;
    addonType: 'employee' | 'appointment' | 'spotPass';
    quantity: number; // The logic: purchased unitQuantity * number of times bought
    paymentStatus: 'pending' | 'succeeded' | 'failed' | 'cancelled';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    isActive: boolean;
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
            required: true,
        },
        addonType: {
            type: String,
            enum: ['employee', 'appointment', 'spotPass'],
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
    },
    {
        timestamps: true,
    }
);

export const UserAddon = mongoose.model<IUserAddon>(
    'UserAddon',
    userAddonSchema
);
