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

export class UserService {
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
    const user = await User.findOne({ email: loginData.email }).select('+password');

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
    const user = await User.findById(userId);
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

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
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

    const user = await User.findById(userId).select('+password').session(session);

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
  static async getAllUsers(page: number = 1, limit: number = 10): Promise<{
    users: IUserResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({})
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({})
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
   * Delete user (admin function)
   */
  @Transaction('Failed to delete user')
  static async deleteUser(userId: string, options: { session?: any } = {}): Promise<void> {
    const { session } = options;

    const user = await User.findByIdAndDelete(userId).session(session);
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }
  }

  /**
   * Verify user email
   */
  @Transaction('Failed to verify email')
  static async verifyEmail(userId: string, options: { session?: any } = {}): Promise<IUserResponse> {
    const { session } = options;

    const user = await User.findByIdAndUpdate(
      userId,
      { isEmailVerified: true },
      { new: true, session }
    );

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.NOT_FOUND);
    }

    return user.getPublicProfile();
  }
}