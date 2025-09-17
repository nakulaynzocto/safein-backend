import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../services/user/user.service';
import { ResponseUtil, ERROR_CODES } from '../../utils';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { TryCatch } from '../../decorators';
import { AppError } from '../../middlewares/errorHandler';

export class UserController {
  /**
   * Register a new user
   */
  @TryCatch('Failed to register user')
  static async register(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userData = req.body;
    const user = await UserService.createUser(userData);
    ResponseUtil.created(res, 'User registered successfully', user);
  }

  /**
   * Login user
   */
  @TryCatch('Failed to login user')
  static async login(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const loginData = req.body;
    const result = await UserService.loginUser(loginData);
    ResponseUtil.success(res, 'Login successful', result);
  }

  /**
   * Get current user profile
   */
  @TryCatch('Failed to get user profile')
  static async getProfile(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }
    const userId = req.user._id.toString();
    const user = await UserService.getUserById(userId);
    ResponseUtil.success(res, 'Profile retrieved successfully', user);
  }

  /**
   * Update current user profile
   */
  @TryCatch('Failed to update user profile')
  static async updateProfile(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }
    const userId = req.user._id.toString();
    const updateData = req.body;
    const user = await UserService.updateUser(userId, updateData);
    ResponseUtil.success(res, 'Profile updated successfully', user);
  }

  /**
   * Change password
   */
  @TryCatch('Failed to change password')
  static async changePassword(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }
    const userId = req.user._id.toString();
    const passwordData = req.body;
    await UserService.changePassword(userId, passwordData);
    ResponseUtil.success(res, 'Password changed successfully');
  }

  /**
   * Get user by ID (admin)
   */
  @TryCatch('Failed to get user')
  static async getUserById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { id } = req.params;
    const user = await UserService.getUserById(id);
    ResponseUtil.success(res, 'User retrieved successfully', user);
  }

  /**
   * Get all users (admin)
   */
  @TryCatch('Failed to get users')
  static async getAllUsers(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { page = 1, limit = 10, includeDeleted = false } = req.query;
    const result = await UserService.getAllUsers(
      parseInt(page as string),
      parseInt(limit as string),
      includeDeleted === 'true'
    );
    ResponseUtil.success(res, 'Users retrieved successfully', result);
  }

  /**
   * Update user by ID (admin)
   */
  @TryCatch('Failed to update user')
  static async updateUserById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { id } = req.params;
    const updateData = req.body;
    const user = await UserService.updateUser(id, updateData);
    ResponseUtil.success(res, 'User updated successfully', user);
  }

  /**
   * Soft delete user by ID (admin)
   */
  @TryCatch('Failed to delete user')
  static async deleteUserById(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }
    const { id } = req.params;
    const deletedBy = req.user._id.toString();
    await UserService.deleteUser(id, deletedBy);
    ResponseUtil.success(res, 'User deleted successfully');
  }

  /**
   * Restore user from trash (admin)
   */
  @TryCatch('Failed to restore user')
  static async restoreUserById(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { id } = req.params;
    const user = await UserService.restoreUser(id);
    ResponseUtil.success(res, 'User restored successfully', user);
  }

  /**
   * Verify user email
   */
  @TryCatch('Failed to verify email')
  static async verifyEmail(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { id } = req.params;
    const user = await UserService.verifyEmail(id);
    ResponseUtil.success(res, 'Email verified successfully', user);
  }

  /**
   * Forgot password
   */
  @TryCatch('Failed to send password reset email')
  static async forgotPassword(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    // This would typically send an email with reset link
    // For now, just return success message
    ResponseUtil.success(res, 'Password reset email sent successfully');
  }

  /**
   * Reset password
   */
  @TryCatch('Failed to reset password')
  static async resetPassword(_req: Request, res: Response, _next: NextFunction): Promise<void> {
    // This would typically validate the reset token and update password
    // For now, just return success message
    ResponseUtil.success(res, 'Password reset successfully');
  }

  /**
   * Logout user
   */
  @TryCatch('Failed to logout')
  static async logout(_req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    // In a real application, you might want to blacklist the token
    ResponseUtil.success(res, 'Logout successful');
  }
}