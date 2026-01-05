import { Request } from 'express';
// @ts-ignore
import { CONSTANTS } from '../../utils/constants';
import { AppError } from '../errorHandler';
import { ERROR_CODES } from '../../utils/constants';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Load Public Key
// Ensure certs directory exists in root
const PUBLIC_KEY_PATH = path.join(process.cwd(), 'certs', 'public.pem');
let PUBLIC_KEY = '';

try {
    if (fs.existsSync(PUBLIC_KEY_PATH)) {
        PUBLIC_KEY = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    } else {
        console.error('CRITICAL: Public Key not found at ' + PUBLIC_KEY_PATH);
    }
} catch (e) {
    console.error('CRITICAL: Failed to load Public Key', e);
}

/**
 * Attempts to authenticate the request using the Master Token headers.
 * Now supports RS256 Signed JWTs.
 * 
 * @param req Express Request object
 * @returns The populated user object if authentication is successful
 * @throws AppError if Master Token is invalid or Verification fails
 */
export const authenticateWithMasterToken = (req: Request) => {
    const token = req.headers['x-master-token'] as string;

    if (!token) {
        return null;
    }

    // LEGACY CHECK (Optional: remove if hard swtich)
    // For now, if verification fails (e.g. string token), we might want to fail? 
    // Or check if it LOOKS like a JWT?
    // User requested "Apply", which usually implies replacing the logic.
    // The previous logic used CONSTANTS.MASTER_TOKEN.

    // I will enforce JWT verification securely.

    if (!PUBLIC_KEY) {
        throw new AppError('Server Misconfiguration: Public Key Missing', ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    try {
        const decoded = jwt.verify(token, PUBLIC_KEY, {
            algorithms: ['RS256'],
            issuer: 'safein-super-admin-backend',
            audience: 'gatekeeper-visitor-api'
        }) as any;

        return {
            _id: decoded.sub,
            email: decoded.email,
            roles: [decoded.role || 'superadmin'],
            isActive: true,
        };

    } catch (err) {
        // Verification failed
        throw new AppError('Unauthorized: Invalid Master Token Signature', ERROR_CODES.UNAUTHORIZED);
    }
};
