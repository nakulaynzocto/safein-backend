import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { User } from '../models/user/user.model';
import { ResponseUtil } from '../utils';
import { IUser } from '../types/user/user.types';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      ResponseUtil.unauthorized(res, 'Authorization header is required');
      return;
    }

    const token = JwtUtil.extractTokenFromHeader(authHeader);
    const decoded = JwtUtil.verifyToken(token);

    // Find user and check if still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      ResponseUtil.unauthorized(res, 'User not found or account disabled');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    ResponseUtil.unauthorized(res, 'Invalid or expired token');
  }
};

export const protect = verifyToken; // Alias for verifyToken
