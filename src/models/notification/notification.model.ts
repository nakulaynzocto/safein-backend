import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId; // User who should receive this notification
    type: 'appointment_approved' | 'appointment_rejected' | 'appointment_created' | 'appointment_deleted' | 'appointment_status_changed' | 'general';
    title: string;
    message: string;
    read: boolean;
    readAt?: Date;
    appointmentId?: mongoose.Types.ObjectId; // Reference to Appointment (if applicable)
    metadata?: {
        [key: string]: any; // Additional data for the notification
    };
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        type: {
            type: String,
            enum: ['appointment_approved', 'appointment_rejected', 'appointment_created', 'appointment_deleted', 'appointment_status_changed', 'general'],
            required: [true, 'Notification type is required'],
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        read: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
            default: null,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ appointmentId: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);

