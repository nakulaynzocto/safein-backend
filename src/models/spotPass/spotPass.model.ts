import mongoose, { Schema, Document } from 'mongoose';

export enum SpotPassStatus {
    CHECKED_IN = 'checked-in',
    CHECKED_OUT = 'checked-out',
}

export interface ISpotPass extends Document {
    visitorId: mongoose.Types.ObjectId;
    businessId: mongoose.Types.ObjectId; // User/Business ID
    name: string;
    phone: string;
    gender: string;
    address: string;
    photo?: string;
    vehicleNumber?: string;
    notes?: string;
    checkInTime: Date;
    checkOutTime?: Date;
    status: SpotPassStatus;
    createdBy: mongoose.Types.ObjectId; // Same as businessId or security guard user
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const spotPassSchema = new Schema<ISpotPass>(
    {
        visitorId: {
            type: Schema.Types.ObjectId,
            ref: 'Visitor',
            required: [true, 'Visitor ID is required'],
        },
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Business ID is required'],
        },
        name: {
            type: String,
            required: [true, 'Visitor name is required'],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        gender: {
            type: String,
            required: [true, 'Gender is required'],
            trim: true,
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        photo: {
            type: String,
            trim: true,
        },
        vehicleNumber: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },
        checkInTime: {
            type: Date,
            default: Date.now,
        },
        checkOutTime: {
            type: Date,
        },
        status: {
            type: String,
            enum: Object.values(SpotPassStatus),
            default: SpotPassStatus.CHECKED_IN,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator ID is required'],
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

spotPassSchema.index({ businessId: 1, createdAt: -1 });
spotPassSchema.index({ phone: 1 });
spotPassSchema.index({ status: 1 });
spotPassSchema.index({ isDeleted: 1 });

export const SpotPass = mongoose.model<ISpotPass>('SpotPass', spotPassSchema);
