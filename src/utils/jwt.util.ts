import jwt, { SignOptions } from 'jsonwebtoken';
import { CONSTANTS } from './constants';

export interface JwtPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

export class JwtUtil {
    /**
     * Generate JWT token
     */
    static generateToken(payload: { userId: string; email: string }): string {
        return jwt.sign(payload, CONSTANTS.JWT_SECRET, { expiresIn: CONSTANTS.JWT_EXPIRATION } as any);
    }

    /**
     * Generate JWT token with user details (legacy method)
     */
    public generateTokenWithUserDetails(user: JwtPayload): string {
        const payload = {
            userId: user.userId,
            email: user.email,
        };

        return jwt.sign(payload, CONSTANTS.JWT_SECRET, { expiresIn: CONSTANTS.JWT_EXPIRATION } as any);
    }


    /**
     * Verify JWT token
     */
    static verifyToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, CONSTANTS.JWT_SECRET) as JwtPayload;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Generate refresh token
     */
    static generateRefreshToken(payload: { userId: string; email: string }): string {
        const options: SignOptions = {
            expiresIn: '7d', // Refresh token expires in 7 days
        };
        return jwt.sign(payload, CONSTANTS.JWT_SECRET, options);
    }

    /**
     * Extract token from Authorization header
     */
    static extractTokenFromHeader(authHeader: string | undefined): string {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Invalid authorization header');
        }
        return authHeader.substring(7); // Remove 'Bearer ' prefix
    }
}
