import mongoose, { Schema, Document } from 'mongoose';

export enum SpecialBookingStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    CANCELLED = 'cancelled',
}

export interface ISpecialVisitorBooking extends Document {
    visitorName: string;
    visitorEmail: string;
    visitorPhone: string;
    employeeId: mongoose.Types.ObjectId;
    purpose: string;
    scheduledDate?: string;
    scheduledTime?: string;
    accompanyingCount: number;
    notes?: string;
    otp?: string;
    otpExpiresAt?: Date;
    status: SpecialBookingStatus;
    createdBy: mongoose.Types.ObjectId;
    visitorId?: mongoose.Types.ObjectId; // Populated after verification
    appointmentId?: mongoose.Types.ObjectId; // Populated after verification
    createdAt: Date;
    updatedAt: Date;
}

const specialVisitorBookingSchema = new Schema<ISpecialVisitorBooking>(
    {
        visitorName: {
            type: String,
            required: [true, 'Visitor name is required'],
            trim: true,
        },
        visitorEmail: {
            type: String,
            required: [true, 'Visitor email is required'],
            lowercase: true,
            trim: true,
        },
        visitorPhone: {
            type: String,
            required: [true, 'Visitor phone number is required'],
            trim: true,
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: [true, 'Employee ID is required'],
        },
        purpose: {
            type: String,
            required: [true, 'Purpose of visit is required'],
            trim: true,
        },
        scheduledDate: {
            type: String,
        },
        scheduledTime: {
            type: String,
        },
        accompanyingCount: {
            type: Number,
            default: 0,
        },
        notes: {
            type: String,
            trim: true,
        },
        otp: {
            type: String,
        },
        otpExpiresAt: {
            type: Date,
        },
        status: {
            type: String,
            enum: Object.values(SpecialBookingStatus),
            default: SpecialBookingStatus.PENDING,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator ID is required'],
        },
        visitorId: {
            type: Schema.Types.ObjectId,
            ref: 'Visitor',
        },
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

specialVisitorBookingSchema.index({ visitorEmail: 1 });
specialVisitorBookingSchema.index({ employeeId: 1 });
specialVisitorBookingSchema.index({ createdBy: 1 });
specialVisitorBookingSchema.index({ status: 1 });

export const SpecialVisitorBooking = mongoose.model<ISpecialVisitorBooking>(
    'SpecialVisitorBooking',
    specialVisitorBookingSchema
);
