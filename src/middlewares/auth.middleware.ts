import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { User } from '../models/user/user.model';
import { IUser } from '../types/user/user.types';
import { AppError } from './errorHandler';
import { ERROR_CODES } from '../utils/constants';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  isPremiumUser?: boolean;
  activeSubscription?: any;
}

export const verifyToken = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('Authorization header is required', ERROR_CODES.UNAUTHORIZED);
    }

    const token = JwtUtil.extractTokenFromHeader(authHeader);
    const decoded = JwtUtil.verifyToken(token);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or account disabled', ERROR_CODES.UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token', ERROR_CODES.UNAUTHORIZED));
    }
  }
};

export const protect = verifyToken; // Alias for verifyToken