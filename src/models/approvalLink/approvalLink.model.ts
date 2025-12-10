import mongoose, { Schema } from 'mongoose';

export interface IApprovalLink extends mongoose.Document {
    appointmentId: mongoose.Types.ObjectId; // Reference to Appointment
    token: string; // Unique secure token
    isUsed: boolean; // Whether the link has been used
    createdAt: Date;
    updatedAt: Date;
}

const approvalLinkSchema = new Schema<IApprovalLink>(
    {
        appointmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Appointment',
            required: [true, 'Appointment ID is required'],
            unique: true // One approval link per appointment
        },
        token: {
            type: String,
            required: [true, 'Token is required'],
            unique: true,
            trim: true
        },
        isUsed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Indexes for better query performance
// Note: token and appointmentId already have indexes from unique: true
approvalLinkSchema.index({ isUsed: 1 });

export const ApprovalLink = mongoose.model<IApprovalLink>('ApprovalLink', approvalLinkSchema);




