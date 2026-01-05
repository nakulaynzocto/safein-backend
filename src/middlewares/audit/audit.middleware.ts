import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../../services/internal/audit.service';

/**
 * Middleware to intercept Super Admin requests and log them to the AuditLog.
 * 
 * Logic:
 * 1. Runs for /internal/super-admin routes.
 * 2. Listens for response 'finish' event to ensure request was processed.
 * 3. Extracts 'actor' from request headers (or assumes 'super_admin_api').
 * 4. Derives 'Action' from HTTP Method + Route usage.
 * 5. Logs to DB via AuditService.
 */
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
    // We only log operations that modify state (POST, PUT, DELETE, PATCH),
    // OR critical GET operations if needed (e.g., viewing all users).
    // Let's log ALL for now as per "track all actions" requirement or filter by method.
    // Generally audit logs focus on writes. GETs can be noisy.
    // User said: "not good method ye log middlevaew se handle hone chahiye all action log store hone chahiye"
    // implies catching everything or at least significant things.

    // Skip logging for GET requests? Or keep them?
    const method = req.method;
    if (method === 'OPTIONS') return next();

    // Listen for response finish
    res.on('finish', async () => {
        // Only log 2xx, 3xx, or specific error codes? 
        // 4xx might happen if validation fails - maybe we want to log attempts too?
        // Let's log everything for traceability.

        try {
            const action = deriveAction(req);
            const target = deriveTarget(req);
            const changes = (method !== 'GET' && method !== 'DELETE') ? req.body : undefined;

            // Actor - Use req.user if populated by masterToken.middleware (or other auth middleware)
            const actor = {
                id: (req as any).user?._id?.toString() || undefined,
                email: (req as any).user?.email || undefined,
                role: (req as any).user?.roles?.[0] || 'super_admin_api',
                ip: req.ip,
                userAgent: req.get('user-agent'),
            };

            const metadata = {
                method,
                statusCode: res.statusCode,
                path: req.originalUrl,
                params: req.params,
                query: req.query
            };

            // Don't await this to avoid delaying response (though response is already finished here)
            // But we need to ensure it runs.
            await AuditService.log(
                action,
                actor,
                target,
                changes ? { body: changes } : undefined, // Wrap body in an object structure or pass as is? AuditService expects 'changes' object.
                metadata
            );

        } catch (error) {
            // Silently handle audit logging errors to avoid disrupting the main flow
        }
    });

    next();
};

/**
 * Helper to derive a readable ACTION name from the request
 */
function deriveAction(req: Request): string {
    const method = req.method;
    const path = req.path; // e.g., '/users', '/users/:id'

    // Normalize path to remove IDs for pattern matching logic is cleaner with regex or route path if available?
    // req.route.path is available only AFTER matching. In global middleware it might be elusive but here it is mounted on router?
    // This middleware will be mounted on the router, so req.route might be defined? 
    // Actually if we mount it effectively, we might use req.baseUrl + req.path

    // Let's do simple heuristics based on keywords in URL

    if (path.includes('/login')) return 'LOGIN';

    if (path.includes('/subscription-plans')) {
        if (method === 'POST') return 'CREATE_PLAN';
        if (method === 'PUT' || method === 'PATCH') return 'UPDATE_PLAN';
        if (method === 'DELETE') return 'DELETE_PLAN';
        if (method === 'GET') return 'VIEW_PLANS';
    }

    if (path.includes('/features/toggle')) return 'TOGGLE_FEATURE';

    // Users
    if (path.includes('/users')) {
        if (method === 'POST') {
            if (path.includes('/assign-subscription')) return 'ASSIGN_SUBSCRIPTION';
            return 'CREATE_USER';
        }
        if (method === 'PUT' || method === 'PATCH') {
            if (path.includes('/profile')) return 'UPDATE_PROFILE';
            if (path.includes('/cancel-subscription')) return 'CANCEL_SUBSCRIPTION';
            return 'UPDATE_USER';
        }
        if (method === 'DELETE') return 'DELETE_USER';
        if (method === 'GET') return 'VIEW_USERS'; // or VIEW_USER
    }

    if (path.includes('/dashboard/stats')) return 'VIEW_DASHBOARD_STATS';
    if (path.includes('/audit-logs')) return 'VIEW_AUDIT_LOGS';

    return `${method}_${path}`; // Fallback
}

/**
 * Helper to derive Target info
 */
function deriveTarget(req: Request): any {
    const params = req.params || {};
    // Extract ID if present in the URL path manually if params are empty (which happens if middleware runs before route match fully populates params?)
    // Actually, on 'finish', req.params should be populated if route matched.

    let id = params.id;

    // Fallback: try to find ID in path parts
    if (!id) {
        const parts = req.path.split('/');
        // if path is /users/123, parts=["", "users", "123"]
        if (parts.length > 2 && parts[2].length > 10) { // simplistic mongo id check
            id = parts[2];
        }
    }

    const collectionName = req.path.split('/')[1] || 'unknown'; // users, subscription-plans, etc.

    return {
        id,
        collectionName,
        summary: `${req.method} on ${req.originalUrl}`
    };
}
