import mongoose, { Schema } from 'mongoose';
import { IInquiry } from '../../types/inquiry/inquiry.types';

const inquirySchema = new Schema<IInquiry>(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true
        },
        source: {
            type: String,
            required: [true, 'Source is required'],
            default: 'safein'
        },
        status: {
            type: String,
            enum: ['pending', 'read', 'responded', 'closed'],
            default: 'pending'
        },
        viewedBy: {
            userId: { type: String },
            userName: { type: String }
        },
        viewedAt: {
            type: Date
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

inquirySchema.index({ email: 1 });
inquirySchema.index({ status: 1 });
inquirySchema.index({ createdAt: -1 });

export const Inquiry = mongoose.model<IInquiry>('Inquiry', inquirySchema);
