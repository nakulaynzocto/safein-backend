import { AuditLog } from '../../models/auditLog/auditLog.model';

export interface IAuditActor {
    id?: string;
    email?: string;
    role: string;
    ip?: string;
    userAgent?: string;
}

export interface IAuditTarget {
    id?: string;
    collectionName: string;
    summary?: string;
}

export class AuditService {
    /**
     * Log an action to the database
     */
    static async log(
        action: string,
        actor: IAuditActor,
        target: IAuditTarget,
        changes?: Record<string, any>,
        metadata?: Record<string, any>
    ) {
        try {
            await AuditLog.create({
                action,
                actor,
                target,
                changes,
                metadata
            });
        } catch (error) {
            // Audit logging should not fail the main request, but we should log the error
            console.error('Failed to create audit log:', error);
        }
    }
}
