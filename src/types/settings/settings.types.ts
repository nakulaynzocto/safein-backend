import mongoose, { Document } from 'mongoose';

export interface ISettings extends Document {
    userId: mongoose.Types.ObjectId;
    notifications: {
        emailEnabled: boolean;
        whatsappEnabled: boolean;
        smsEnabled: boolean;
    };
    whatsapp: {
        senderNumber: string; // Phone number from which WhatsApp messages are sent
        verified: boolean; // Whether the WhatsApp number is verified
        verifiedAt?: Date | null; // When the number was verified
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface IUpdateSettingsDTO {
    notifications?: {
        emailEnabled?: boolean;
        whatsappEnabled?: boolean;
        smsEnabled?: boolean;
    };
    whatsapp?: {
        senderNumber?: string;
        verified?: boolean;
        verifiedAt?: Date | null;
    };
}

export interface ISettingsResponse {
    _id: string;
    userId: string;
    notifications: {
        emailEnabled: boolean;
        whatsappEnabled: boolean;
        smsEnabled: boolean;
    };
    whatsapp: {
        senderNumber: string;
        verified: boolean;
        verifiedAt?: Date | null;
    };
    createdAt: Date;
    updatedAt: Date;
}



