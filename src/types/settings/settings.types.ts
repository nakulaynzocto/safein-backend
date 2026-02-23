import mongoose, { Document } from 'mongoose';

export interface ISettings extends Document {
    userId: mongoose.Types.ObjectId;
    notifications: {
        emailEnabled: boolean;
        whatsappEnabled: boolean;
        smsEnabled: boolean;
    };
    whatsapp: {
        activeProvider: 'meta' | 'custom';
        senderNumber: string; // Phone number from which WhatsApp messages are sent
        apiUrl?: string;
        apiKey?: string;
        phoneNumberId?: string;
        accessToken?: string;
        verified: boolean; // Overall verification status (usually tied to active)
        metaVerified: boolean;
        customVerified: boolean;
        verifiedAt?: Date | null; // When the number was verified
        verificationOtp?: string | null;
        verificationOtpExpiry?: Date | null;
        testNumber?: string;
    };
    smtp?: {
        host?: string;
        port?: number;
        secure?: boolean;
        user?: string;
        pass?: string;           // encrypted at rest
        fromName?: string;
        fromEmail?: string;
        verified?: boolean;
        verifiedAt?: Date | null;
    };
    pendingWhatsapp?: {
        activeProvider: 'meta' | 'custom';
        senderNumber: string;
        testNumber?: string;
        apiUrl?: string;
        apiKey?: string;
        phoneNumberId?: string;
        accessToken?: string;
    } | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISmtpConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    fromName: string;
    fromEmail: string;
}

export interface IUpdateSettingsDTO {
    notifications?: {
        emailEnabled?: boolean;
        whatsappEnabled?: boolean;
        smsEnabled?: boolean;
    };
    smtp?: Partial<ISmtpConfig>;
    whatsapp?: {
        activeProvider?: 'meta' | 'custom';
        senderNumber?: string;
        testNumber?: string;
        apiUrl?: string;
        apiKey?: string;
        phoneNumberId?: string;
        accessToken?: string;
        verified?: boolean;
        metaVerified?: boolean;
        customVerified?: boolean;
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
    smtp?: {
        host?: string;
        port?: number;
        secure?: boolean;
        user?: string;
        pass?: string;        // always masked in responses
        fromName?: string;
        fromEmail?: string;
        verified?: boolean;
        verifiedAt?: Date | null;
    };
    whatsapp: {
        activeProvider: 'meta' | 'custom';
        senderNumber: string;
        testNumber?: string;
        apiUrl?: string;
        apiKey?: string;
        phoneNumberId?: string;
        accessToken?: string;
        verified: boolean;
        metaVerified: boolean;
        customVerified: boolean;
        verifiedAt?: Date | null;
    };
    createdAt: Date;
    updatedAt: Date;
}



