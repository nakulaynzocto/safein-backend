import { Request, Response, NextFunction } from "express";
import { JwtUtil } from "../utils/jwt.util";
import { User } from "../models/user/user.model";
import { IUser } from "../types/user/user.types";
import { AppError } from "./errorHandler";
import { ERROR_CODES } from "../utils/constants";

export interface AuthenticatedRequest extends Request {
    user?: IUser;
    isPremiumUser?: boolean;
    activeSubscription?: any;
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

import { authenticateWithMasterToken } from "./auth/auth.utils";

export const verifyToken = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
        // Check for Master Token first
        const masterTokenUser = authenticateWithMasterToken(req);
        if (masterTokenUser) {
            req.user = masterTokenUser as any;
            return next();
        }

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError("Authorization header is required", ERROR_CODES.UNAUTHORIZED);
        }

        const token = JwtUtil.extractTokenFromHeader(authHeader);
        const decoded = JwtUtil.verifyToken(token);

        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            throw new AppError("User not found or account disabled", ERROR_CODES.UNAUTHORIZED);
        }

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof AppError) {
            next(error);
        } else {
            next(new AppError("Invalid or expired token", ERROR_CODES.UNAUTHORIZED));
        }
    }
};

export const protect = verifyToken; // Alias for verifyToken

export const verifyTokenOptional = async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next();
        }

        const token = JwtUtil.extractTokenFromHeader(authHeader);
        const decoded = JwtUtil.verifyToken(token);

        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
            req.user = user;
        }
        next();
    } catch (error) {
        // If token is invalid or expired, just proceed as unauthenticated
        next();
    }
};
