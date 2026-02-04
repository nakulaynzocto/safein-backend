import { Request, Response, NextFunction } from 'express';
import { UserService } from '../../services/user/user.service';
import { ResponseUtil, ERROR_CODES } from '../../utils';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { TryCatch } from '../../decorators';
import { AppError } from '../../middlewares/errorHandler';
export class UserController {
  /**
   * Register a new user (sends OTP)
   */
  @TryCatch('Failed to register user')
  static async register(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const userData = req.body;
    const result = await UserService.initiateRegistration(userData);
    ResponseUtil.success(res, 'OTP sent to your email', result);
  }

  /**
   * Verify OTP and complete registration
   */
  @TryCatch('Failed to verify OTP')
  static async verifyOtp(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { email, otp } = req.body;
    const result = await UserService.verifyOtpAndCompleteRegistration(email, otp);
    ResponseUtil.success(res, 'OTP verified — registration complete', result);
  }

  /**
   * Resend OTP
   */
  @TryCatch('Failed to resend OTP')
  static async resendOtp(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { email } = req.body;
    const result = await UserService.resendOtp(email);
    ResponseUtil.success(res, 'OTP resent to your email', result);
  }

  /**
   * Login user
   */
  @TryCatch('Failed to login user')
  static async login(req: Request, res: Response, _next: NextFunction): Promise<void> {
    // const loginData = req.body;
    let { email, password } = req.body;

    // create login object
    const loginData = {
      email: email,
      password: password,
    };
    console.log("login function call")
    console.log("login details", loginData)
    try {
      const result = await UserService.loginUser(loginData);
      // Login attempt tracking is handled by loginAttemptTracker middleware
      ResponseUtil.success(res, 'Login successful', result);
    } catch (error: any) {
      // Login attempt tracking for failures is handled by loginAttemptTracker middleware
      throw error;
    }
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
   * Get user by ID (admin or own profile)
   */
  @TryCatch('Failed to get user')
  static async getUserById(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }

    const currentUserId = req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (id !== currentUserId && !isAdmin) {
      throw new AppError('Access denied. You can only access your own profile.', ERROR_CODES.FORBIDDEN);
    }

    const user = await UserService.getUserById(id);
    ResponseUtil.success(res, 'User retrieved successfully', user);
  }

  /**
   * Get all users (admin only)
   */
  @TryCatch('Failed to get users')
  static async getAllUsers(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }

    if (!req.user.roles.includes('admin')) {
      throw new AppError('Access denied. Admin role required.', ERROR_CODES.FORBIDDEN);
    }

    const { page = 1, limit = 10, includeDeleted = false } = req.query;
    const result = await UserService.getAllUsers(
      parseInt(page as string),
      parseInt(limit as string),
      includeDeleted === 'true',
      req.user._id.toString()
    );
    ResponseUtil.success(res, 'Users retrieved successfully', result);
  }

  /**
   * Update user by ID (admin or own profile)
   */
  @TryCatch('Failed to update user')
  static async updateUserById(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    const { id } = req.params;

    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }

    const currentUserId = req.user._id.toString();
    const isAdmin = req.user.roles.includes('admin');

    if (id !== currentUserId && !isAdmin) {
      throw new AppError('Access denied. You can only update your own profile.', ERROR_CODES.FORBIDDEN);
    }

    const updateData = req.body;
    const user = await UserService.updateUser(id, updateData);
    ResponseUtil.success(res, 'User updated successfully', user);
  }

  /**
   * Soft delete user by ID (admin only)
   */
  @TryCatch('Failed to delete user')
  static async deleteUserById(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }

    if (!req.user.roles.includes('admin')) {
      throw new AppError('Access denied. Admin role required.', ERROR_CODES.FORBIDDEN);
    }

    const { id } = req.params;
    const deletedBy = req.user._id.toString();
    await UserService.deleteUser(id, deletedBy);
    ResponseUtil.success(res, 'User deleted successfully');
  }

  /**
   * Restore user from trash (admin only)
   */
  @TryCatch('Failed to restore user')
  static async restoreUserById(req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    if (!req.user) {
      throw new AppError('User not authenticated', ERROR_CODES.UNAUTHORIZED);
    }

    if (!req.user.roles.includes('admin')) {
      throw new AppError('Access denied. Admin role required.', ERROR_CODES.FORBIDDEN);
    }

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
  static async forgotPassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const forgotPasswordData = req.body;
    const result = await UserService.forgotPassword(forgotPasswordData);
    ResponseUtil.success(res, result.message, result);
  }

  /**
   * Reset password
   */
  @TryCatch('Failed to reset password')
  static async resetPassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const resetPasswordData = req.body;
    await UserService.resetPassword(resetPasswordData);
    ResponseUtil.success(res, 'Password reset successfully');
  }

  /**
   * Setup employee password (activates account and returns login credentials)
   * POST /api/v1/users/setup-employee-password
   */
  @TryCatch('Failed to setup employee password')
  static async setupEmployeePassword(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const setupPasswordData = req.body;
    const result = await UserService.setupEmployeePassword(setupPasswordData);
    ResponseUtil.success(res, 'Employee password setup successful. Account activated.', result);
  }

  @TryCatch('Failed to logout')
  static async logout(_req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> {
    ResponseUtil.success(res, 'Logout successful');
  }

  /**
   * Exchange Impersonation Token
   */
  @TryCatch('Failed to exchange impersonation token')
  static async exchangeImpersonationToken(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const { code } = req.body;
    const result = await UserService.exchangeImpersonationToken(code);
    ResponseUtil.success(res, 'Impersonation secure exchange successful', result);
  }
}