import mongoose from 'mongoose';
import { User } from '../../models/user/user.model';
import {
  ICreateUserDTO,
  IUpdateUserDTO,
  ILoginDTO,
  IChangePasswordDTO,
  IForgotPasswordDTO,
  IResetPasswordDTO,
  IUserResponse
} from '../../types/user/user.types';
import { ERROR_MESSAGES, ERROR_CODES, CONSTANTS } from '../../utils/constants';
import { JwtUtil } from '../../utils/jwt.util';
import { AppError } from '../../middlewares/errorHandler';
import { Transaction } from '../../decorators';
import { EmailService } from '../email/email.service';
import { RedisOtpService } from '../redis/redisOtp.service';
import { getRedisClient } from '../../config/redis.config';
import { SubscriptionPlan } from '../../models/subscription/subscription.model';
import { UserSubscription } from '../../models/userSubscription/userSubscription.model';
import * as crypto from 'crypto';

export class UserService {
  /**
   * Generate a 6-digit OTP
   */
  private static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to email using SMTP
   */
  private static async sendOtpToEmail(email: string, otp: string, companyName: string): Promise<void> {
    try {
      await EmailService.sendOtpEmail(email, otp, companyName);
    } catch (error: any) {
      if (CONSTANTS.NODE_ENV === 'development') {
        return;
      }
      throw new AppError('Failed to send OTP email', ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Initiate registration by sending OTP
   */
  static async initiateRegistration(userData: ICreateUserDTO): Promise<{ email: string; otpSent: boolean }> {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError(ERROR_MESSAGES.EMAIL_ALREADY_IN_USE, ERROR_CODES.CONFLICT);
    }

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in Redis
    await RedisOtpService.storeOtp(userData.email, { otp, expiresAt, userData });

    await this.sendOtpToEmail(userData.email, otp, userData.companyName);

    return {
      email: userData.email,
      otpSent: true
    };
  }

  /**
   * Verify OTP and complete registration
   */
  @Transaction('Failed to complete registration')
  static async verifyOtpAndCompleteRegistration(email: string, otp: string, options: { session?: any } = {}): Promise<{ user: IUserResponse; token: string }> {
    const { session } = options;

    // Get OTP from Redis
    const otpData = await RedisOtpService.getOtp(email);
    if (!otpData) {
      throw new AppError('OTP not found or expired', ERROR_CODES.BAD_REQUEST);
    }

    // Check if OTP is expired (Redis TTL handles this, but double-check for safety)
    if (new Date() > otpData.expiresAt) {
      await RedisOtpService.deleteOtp(email);
      throw new AppError('OTP expired', ERROR_CODES.BAD_REQUEST);
    }

    if (otpData.otp !== otp) {
      throw new AppError('OTP incorrect', ERROR_CODES.BAD_REQUEST);
    }

    const user = new User(otpData.userData);
    await user.save({ session });

    // Auto-assign free trial subscription on registration
    // Find active free plan and create subscription
    const freePlan = await SubscriptionPlan.findOne({
      planType: 'free',
      isActive: true,
      isDeleted: false
    }).session(session);

    if (freePlan) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (freePlan.trialDays || 3));

      const subscription = new UserSubscription({
        userId: user._id,
        planType: 'free',
        startDate,
        endDate,
        isActive: true,
        paymentStatus: 'succeeded',
        trialDays: freePlan.trialDays || 3,
      });
      await subscription.save({ session });

      // Update user's activeSubscriptionId
      user.activeSubscriptionId = subscription._id as mongoose.Types.ObjectId;
      await user.save({ session });
    }

    // Delete OTP from Redis after successful verification
    await RedisOtpService.deleteOtp(email);

    const token = JwtUtil.generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    try {
      await EmailService.sendWelcomeEmail(user.email, user.companyName);
    } catch (error) {
    }

    return {
      user: user.getPublicProfile(),
      token,
    };
  }

  /**
   * Resend OTP
   */
  static async resendOtp(email: string): Promise<{ message: string }> {
    // Get existing OTP data from Redis
    const otpData = await RedisOtpService.getOtp(email);
    if (!otpData) {
      throw new AppError('No pending registration found for this email', ERROR_CODES.BAD_REQUEST);
    }

    const newOtp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Update OTP in Redis
    await RedisOtpService.updateOtp(email, { otp: newOtp, expiresAt });

    await this.sendOtpToEmail(email, newOtp, otpData.userData.companyName);

    return {
      message: 'OTP resent successfully'
    };
  }
  /**
   * Create a new user
   */
  @Transaction('Failed to create user')
  static async createUser(userData: ICreateUserDTO, options: { session?: any } = {}): Promise<IUserResponse> {
    const { session } = options;

    const existingUser = await User.findOne({ email: userData.email }).session(session);
    if (existingUser) {
      throw new AppError(ERROR_MESSAGES.EMAIL_ALREADY_IN_USE, ERROR_CODES.CONFLICT);
    }

    const user = new User(userData);
    await user.save({ session });

    return user.getPublicProfile();
  }

  /**
   * Login user
   */
  @Transaction('Failed to login user')
  static async loginUser(
    loginData: ILoginDTO,
    options: { session?: any } = {}
  ): Promise<{ user: IUserResponse; token: string }> {
    const { session } = options;
    const user = await User.findOne({ email: loginData.email, isDeleted: false }).select('+password').session(session);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, ERROR_CODES.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new AppError(ERROR_MESSAGES.ACCOUNT_DISABLED, ERROR_CODES.UNAUTHORIZED);
    }

    const isPasswordValid = await user.comparePassword(loginData.password);

    if (!isPasswordValid) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, ERROR_CODES.UNAUTHORIZED);
    }

    user.lastLoginAt = new Date();
    await user.save({ session });

    // Note: Subscription plans are only created after successful payment via Stripe webhook
    // No automatic free trial creation on login

    const token = JwtUtil.generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return {
      user: user.getPublicProfile(),
      token,
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<IUserResponse> {
    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
    return user.getPublicProfile();
  }

  /**
   * Update user profile
   */
  @Transaction('Failed to update user')
  static async updateUser(userId: string, updateData: IUpdateUserDTO, options: { session?: any } = {}): Promise<IUserResponse> {
    const { session } = options;

    const safeUpdateData: Partial<IUpdateUserDTO> = {};

    if (updateData.companyName !== undefined) {
      safeUpdateData.companyName = updateData.companyName;
    }
    if (updateData.profilePicture !== undefined) {
      safeUpdateData.profilePicture = updateData.profilePicture;
    }
    if (updateData.companyId !== undefined) {
      safeUpdateData.companyId = updateData.companyId;
    }
    if (updateData.roles !== undefined) {
      safeUpdateData.roles = updateData.roles;
    }
    if (updateData.department !== undefined) {
      safeUpdateData.department = updateData.department;
    }
    if (updateData.designation !== undefined) {
      safeUpdateData.designation = updateData.designation;
    }
    if (updateData.mobileNumber !== undefined) {
      safeUpdateData.mobileNumber = updateData.mobileNumber;
    }
    if (updateData.isActive !== undefined) {
      safeUpdateData.isActive = updateData.isActive;
    }

    delete (safeUpdateData as any).session;

    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      safeUpdateData,
      { new: true, runValidators: true, session }
    );

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return user.getPublicProfile();
  }

  /**
   * Change user password
   */
  @Transaction('Failed to change password')
  static async changePassword(userId: string, passwordData: IChangePasswordDTO, options: { session?: any } = {}): Promise<void> {
    const { session } = options;

    const user = await User.findOne({ _id: userId, isDeleted: false }).select('+password').session(session);

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    const isCurrentPasswordValid = await user.comparePassword(passwordData.currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AppError(ERROR_MESSAGES.PASSWORD_MISMATCH, ERROR_CODES.UNAUTHORIZED);
    }

    user.password = passwordData.newPassword;
    await user.save({ session });
  }

  /**
   * Get all users (admin function)
   */
  static async getAllUsers(page: number = 1, limit: number = 10, includeDeleted: boolean = false): Promise<{
    users: IUserResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const filter = includeDeleted ? {} : { isDeleted: false };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate('deletedBy', 'companyName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    const usersWithoutPassword = users.map(user => user.getPublicProfile());

    return {
      users: usersWithoutPassword,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Soft delete user (admin function)
   */
  @Transaction('Failed to delete user')
  static async deleteUser(userId: string, deletedBy: string, options: { session?: any } = {}): Promise<void> {
    const { session } = options;

    const user = await User.findOne({ _id: userId, isDeleted: false }).session(session);
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    await (user as any).softDelete(deletedBy);
  }

  /**
   * Restore user from trash (admin function)
   */
  @Transaction('Failed to restore user')
  static async restoreUser(userId: string, options: { session?: any } = {}): Promise<IUserResponse> {
    const { session } = options;

    const user = await User.findOne({ _id: userId, isDeleted: true }).session(session);
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    await (user as any).restore();
    return user.getPublicProfile();
  }

  /**
   * Verify user email
   */
  @Transaction('Failed to verify email')
  static async verifyEmail(userId: string, options: { session?: any } = {}): Promise<IUserResponse> {
    const { session } = options;

    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      { isEmailVerified: true },
      { new: true, session }
    );

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return user.getPublicProfile();
  }

  /**
   * Forgot password - Generate reset token and send email
   */
  @Transaction('Failed to process forgot password request')
  static async forgotPassword(forgotPasswordData: IForgotPasswordDTO): Promise<{ message: string }> {
    const { email } = forgotPasswordData;

    const user = await User.findOne({ email, isDeleted: false }).select('+passwordResetToken +resetPasswordExpires');

    // Always return success message (security best practice - don't reveal if email exists)
    if (!user) {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiration (1 hour from now)
    user.passwordResetToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // Create reset URL - Use APPROVAL_LINK_BASE_URL (same as approve/reject links) or fallback to FRONTEND_URL
    const baseUrl = CONSTANTS.APPROVAL_LINK_BASE_URL;
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${resetToken}`;

    try {
      // Send password reset email
      await EmailService.sendPasswordResetEmail(user.email, resetUrl, user.companyName);
    } catch (error: any) {
      // If email fails, clear the token
      user.passwordResetToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });

      if (CONSTANTS.NODE_ENV === 'development') {
        console.error('Failed to send password reset email:', error.message);
        return { message: 'Password reset email could not be sent. Please try again later.' };
      }
      throw new AppError('Failed to send password reset email', ERROR_CODES.INTERNAL_SERVER_ERROR);
    }

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  /**
   * Reset password using token
   */
  @Transaction('Failed to reset password')
  static async resetPassword(resetPasswordData: IResetPasswordDTO, options: { session?: any } = {}): Promise<void> {
    const { token, newPassword } = resetPasswordData;
    const { session } = options;

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token and not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
      isDeleted: false
    }).select('+passwordResetToken +resetPasswordExpires +password').session(session);

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired', ERROR_CODES.BAD_REQUEST);
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ session });

    // Optionally send confirmation email
    try {
      await EmailService.sendPasswordResetConfirmationEmail(user.email, user.companyName);
    } catch (error) {
      // Don't fail the reset if email fails
      console.error('Failed to send password reset confirmation email:', error);
    }
  }
  // Exchange Impersonation Token
  static async exchangeImpersonationToken(code: string): Promise<{ user: IUserResponse; token: string }> {
    const redisClient = getRedisClient();
    const redisKey = `impersonate_code:${code}`;

    // 1. Get userId from Redis
    const userId = await redisClient.get(redisKey);

    if (!userId) {
      throw new AppError('Invalid or expired impersonation code', ERROR_CODES.UNAUTHORIZED);
    }

    // 2. DELETE key immediately (Burn after reading)
    await redisClient.del(redisKey);

    // 3. Find User
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    if (!user.isActive) {
      throw new AppError('User account is disabled', ERROR_CODES.UNAUTHORIZED);
    }

    // 4. Generate Session Token
    const token = JwtUtil.generateToken({
      userId: user._id.toString(),
      email: user.email
    });

    return {
      user: user.getPublicProfile(),
      token
    };
  }
}