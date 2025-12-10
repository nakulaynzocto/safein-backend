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
            }
        },
        whatsapp: {
            senderNumber: {
                type: String,
                trim: true,
                default: '',
                match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
            },
            verified: {
                type: Boolean,
                default: false
            },
            verifiedAt: {
                type: Date,
                default: null
            }
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Note: userId already has an index from unique: true

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);

