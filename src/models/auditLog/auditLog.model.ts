import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    action: string;
    actor: {
        id?: string;
        email?: string;
        role: string;
        ip?: string;
        userAgent?: string;
    };
    target: {
        id?: string;
        collectionName: string;
        summary?: string;
    };
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
    createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
    action: { type: String, required: true },
    actor: {
        id: { type: String },
        email: { type: String },
        role: { type: String, required: true },
        ip: { type: String },
        userAgent: { type: String }
    },
    target: {
        id: { type: String },
        collectionName: { type: String, required: true },
        summary: { type: String }
    },
    changes: { type: Object },
    metadata: { type: Object }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

// Index for searching logs
auditLogSchema.index({ 'actor.email': 1 });
auditLogSchema.index({ 'target.collectionName': 1, 'target.id': 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
