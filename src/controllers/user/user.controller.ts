import { Request, Response } from 'express';
import { UserService } from '../../services/user/user.service';
import { ResponseUtil, asyncHandler } from '../../utils';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class UserController {
  /**
   * Register a new user
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;
    const user = await UserService.createUser(userData);
    ResponseUtil.created(res, 'User registered successfully', user);
  });

  /**
   * Login user
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const loginData = req.body;
    const result = await UserService.loginUser(loginData);
    ResponseUtil.success(res, 'Login successful', result);
  });

  /**
   * Get current user profile
   */
  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'User not authenticated');
      return;
    }
    const userId = req.user._id.toString();
    const user = await UserService.getUserById(userId);
    ResponseUtil.success(res, 'Profile retrieved successfully', user);
  });

  /**
   * Update current user profile
   */
  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'User not authenticated');
      return;
    }
    const userId = req.user._id.toString();
    const updateData = req.body;
    const user = await UserService.updateUser(userId, updateData);
    ResponseUtil.success(res, 'Profile updated successfully', user);
  });

  /**
   * Change password
   */
  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'User not authenticated');
      return;
    }
    const userId = req.user._id.toString();
    const passwordData = req.body;
    await UserService.changePassword(userId, passwordData);
    ResponseUtil.success(res, 'Password changed successfully');
  });

  /**
   * Get user by ID (admin)
   */
  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await UserService.getUserById(id);
    ResponseUtil.success(res, 'User retrieved successfully', user);
  });

  /**
   * Get all users (admin)
   */
  static getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const result = await UserService.getAllUsers(
      parseInt(page as string),
      parseInt(limit as string)
    );
    ResponseUtil.success(res, 'Users retrieved successfully', result);
  });

  /**
   * Update user by ID (admin)
   */
  static updateUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const user = await UserService.updateUser(id, updateData);
    ResponseUtil.success(res, 'User updated successfully', user);
  });

  /**
   * Delete user by ID (admin)
   */
  static deleteUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await UserService.deleteUser(id);
    ResponseUtil.success(res, 'User deleted successfully');
  });

  /**
   * Verify user email
   */
  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await UserService.verifyEmail(id);
    ResponseUtil.success(res, 'Email verified successfully', user);
  });

  /**
   * Forgot password
   */
  static forgotPassword = asyncHandler(async (_req: Request, res: Response) => {
    // This would typically send an email with reset link
    // For now, just return success message
    ResponseUtil.success(res, 'Password reset email sent successfully');
  });

  /**
   * Reset password
   */
  static resetPassword = asyncHandler(async (_req: Request, res: Response) => {
    // This would typically validate the reset token and update password
    // For now, just return success message
    ResponseUtil.success(res, 'Password reset successfully');
  });

  /**
   * Logout user
   */
  static logout = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    // In a real application, you might want to blacklist the token
    ResponseUtil.success(res, 'Logout successful');
  });
}
