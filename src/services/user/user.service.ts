import { User } from '../../models/user/user.model';
import {
  ICreateUserDTO,
  IUpdateUserDTO,
  ILoginDTO,
  IChangePasswordDTO,
  IUserResponse
} from '../../types/user/user.types';
import { ERROR_MESSAGES, ERROR_CODES } from '../../utils/constants';
import { JwtUtil } from '../../utils/jwt.util';
import { AppError } from '../../middlewares/errorHandler';
import { Transaction } from '../../decorators';
import { EmailService } from '../email/email.service';

// Simple in-memory OTP storage (in production, use Redis or database)
const otpStorage = new Map<string, { otp: string; expiresAt: Date; userData: ICreateUserDTO }>();

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
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // In development, don't fail registration if email fails
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 DEVELOPMENT MODE - OTP for ${email}: ${otp}`);
        return;
      }
      throw new AppError('Failed to send OTP email', ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Initiate registration by sending OTP
   */
  static async initiateRegistration(userData: ICreateUserDTO): Promise<{ email: string; otpSent: boolean }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError(ERROR_MESSAGES.EMAIL_ALREADY_IN_USE, ERROR_CODES.CONFLICT);
    }

    // Generate OTP
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP with user data
    otpStorage.set(userData.email, { otp, expiresAt, userData });

    // Send OTP to email
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

    // Get stored OTP data
    const otpData = otpStorage.get(email);
    if (!otpData) {
      throw new AppError('OTP not found or expired', ERROR_CODES.BAD_REQUEST);
    }

    // Check if OTP is expired
    if (new Date() > otpData.expiresAt) {
      otpStorage.delete(email);
      throw new AppError('OTP expired', ERROR_CODES.BAD_REQUEST);
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      throw new AppError('OTP incorrect', ERROR_CODES.BAD_REQUEST);
    }

    // Create user with the stored data
    const user = new User(otpData.userData);
    await user.save({ session });

    // Clean up OTP data
    otpStorage.delete(email);

    // Generate token
    const token = JwtUtil.generateToken({
      userId: user._id.toString(),
      email: user.email,
    });

    // Send welcome email
    try {
      await EmailService.sendWelcomeEmail(user.email, user.companyName);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail registration if welcome email fails
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
    // Get stored OTP data
    const otpData = otpStorage.get(email);
    if (!otpData) {
      throw new AppError('No pending registration found for this email', ERROR_CODES.BAD_REQUEST);
    }

    // Generate new OTP
    const newOtp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update stored OTP
    otpStorage.set(email, { ...otpData, otp: newOtp, expiresAt });

    // Send new OTP to email
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

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email }).session(session);
    if (existingUser) {
      throw new AppError(ERROR_MESSAGES.EMAIL_ALREADY_IN_USE, ERROR_CODES.CONFLICT);
    }

    // Create new user
    const user = new User(userData);
    await user.save({ session });

    // Return user without password
    return user.getPublicProfile();
  }

  /**
   * Login user
   */
  static async loginUser(loginData: ILoginDTO): Promise<{ user: IUserResponse; token: string }> {
    // Find user and include password for comparison
    const user = await User.findOne({ email: loginData.email, isDeleted: false }).select('+password');

    if (!user) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, ERROR_CODES.UNAUTHORIZED);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError(ERROR_MESSAGES.ACCOUNT_DISABLED, ERROR_CODES.UNAUTHORIZED);
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(loginData.password);

    if (!isPasswordValid) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, ERROR_CODES.UNAUTHORIZED);
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
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

    // ✅ Ensure session is not part of updateData and filter only allowed fields
    // Create a safe copy that only includes allowed fields from IUpdateUserDTO
    const safeUpdateData: Partial<IUpdateUserDTO> = {};
    
    // Copy only allowed fields explicitly to avoid circular references and unwanted fields
    if (updateData.companyName !== undefined) {
      safeUpdateData.companyName = updateData.companyName;
    }
    // Handle profilePicture - allow empty string or valid URL
    if (updateData.profilePicture !== undefined) {
      // Store empty string as is, or valid URL string
      safeUpdateData.profilePicture = updateData.profilePicture;
    }
    if (updateData.companyId !== undefined) {
      safeUpdateData.companyId = updateData.companyId;
    }
    if (updateData.role !== undefined) {
      safeUpdateData.role = updateData.role;
    }
    if (updateData.department !== undefined) {
      safeUpdateData.department = updateData.department;
    }
    if (updateData.designation !== undefined) {
      safeUpdateData.designation = updateData.designation;
    }
    if (updateData.employeeId !== undefined) {
      safeUpdateData.employeeId = updateData.employeeId;
    }

    // Explicitly ensure session is never included
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

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(passwordData.currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AppError(ERROR_MESSAGES.PASSWORD_MISMATCH, ERROR_CODES.UNAUTHORIZED);
    }

    // Update password
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
}