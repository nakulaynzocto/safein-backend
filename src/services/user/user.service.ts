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
import { StripeService } from '../stripe/stripe.service';
import { UserSubscriptionService } from '../userSubscription/userSubscription.service';

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
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
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

    otpStorage.set(userData.email, { otp, expiresAt, userData });

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

    const otpData = otpStorage.get(email);
    if (!otpData) {
      throw new AppError('OTP not found or expired', ERROR_CODES.BAD_REQUEST);
    }

    if (new Date() > otpData.expiresAt) {
      otpStorage.delete(email);
      throw new AppError('OTP expired', ERROR_CODES.BAD_REQUEST);
    }

    if (otpData.otp !== otp) {
      throw new AppError('OTP incorrect', ERROR_CODES.BAD_REQUEST);
    }

    const user = new User(otpData.userData);
    await user.save({ session });

    const stripeCustomer = await StripeService.findOrCreateCustomer({
        email: user.email,
        name: user.companyName,
        metadata: { userId: user._id.toString() },
    });
    user.stripeCustomerId = stripeCustomer.id;
    await user.save({ session });

    otpStorage.delete(email);

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
    const otpData = otpStorage.get(email);
    if (!otpData) {
      throw new AppError('No pending registration found for this email', ERROR_CODES.BAD_REQUEST);
    }

    const newOtp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    otpStorage.set(email, { ...otpData, otp: newOtp, expiresAt });

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
  static async loginUser(loginData: ILoginDTO, options: { session?: any } = {}): Promise<{ user: IUserResponse; token: string }> {
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
    if (!user.stripeCustomerId) {
        const stripeCustomer = await StripeService.findOrCreateCustomer({
            email: user.email,
            name: user.companyName,
            metadata: { userId: user._id.toString() },
        });
        user.stripeCustomerId = stripeCustomer.id;
    }
    await user.save({ session });

    try {
      const activeSubscription = await UserSubscriptionService.getUserActiveSubscription(user._id.toString());
      if (!activeSubscription && user.stripeCustomerId) {
        await UserSubscriptionService.createFreeTrial(
          user._id.toString(),
          user.stripeCustomerId,
          3
        );
      }
    } catch (error) {
    }

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
}