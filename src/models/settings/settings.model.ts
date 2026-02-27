import mongoose, { Schema } from 'mongoose';
import { ISettings } from '../../types/settings/settings.types';

const settingsSchema = new Schema<ISettings>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            unique: true
        },
        notifications: {
            emailEnabled: {
                type: Boolean,
                default: true
            },
            whatsappEnabled: {
                type: Boolean,
                default: true
            },
            smsEnabled: {
                type: Boolean,
                default: false
            },
            visitor: {
                email: { type: Boolean, default: true },
                whatsapp: { type: Boolean, default: true }
            },
            employee: {
                email: { type: Boolean, default: true },
                whatsapp: { type: Boolean, default: true }
            },
            appointment: {
                email: { type: Boolean, default: true },
                whatsapp: { type: Boolean, default: true }
            }
        },
        whatsapp: {
            activeProvider: {
                type: String,
                enum: ['meta', 'custom'],
                default: 'meta'
            },
            senderNumber: {
                type: String,
                trim: true,
                default: '',
                match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
            },
            phoneNumberId: {
                type: String,
                trim: true,
                default: ''
            },
            accessToken: {
                type: String,
                trim: true,
                default: ''
            },
            verified: {
                type: Boolean,
                default: false
            },
            metaVerified: {
                type: Boolean,
                default: false
            },
            verifiedAt: {
                type: Date,
                default: null
            },
            verificationOtp: {
                type: String,
                default: null
            },
            verificationOtpExpiry: {
                type: Date,
                default: null
            },
            testNumber: {
                type: String,
                trim: true,
                default: ''
            }
        },
        smtp: {
            host: { type: String, trim: true, default: '' },
            port: { type: Number, default: 587 },
            secure: { type: Boolean, default: false },
            user: { type: String, trim: true, default: '' },
            pass: { type: String, trim: true, default: '' },  // encrypted
            fromName: { type: String, trim: true, default: '' },
            fromEmail: { type: String, trim: true, default: '' },
            verified: { type: Boolean, default: false },
            verifiedAt: { type: Date, default: null }
        },
        pendingWhatsapp: {
            activeProvider: { type: String, enum: ['meta', 'custom'] },
            senderNumber: { type: String, trim: true },
            testNumber: { type: String, trim: true },
            phoneNumberId: { type: String, trim: true },
            accessToken: { type: String, trim: true }
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Note: userId already has an index from unique: true

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);

