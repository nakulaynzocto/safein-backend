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

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: ICreateUserDTO): Promise<IUserResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error(ERROR_MESSAGES.EMAIL_ALREADY_IN_USE);
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Return user without password
      return user.getPublicProfile();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create user');
    }
  }

  /**
   * Login user
   */
  static async loginUser(loginData: ILoginDTO): Promise<{ user: IUserResponse; token: string }> {
    try {
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
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to login user');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<IUserResponse> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }
      return user.getPublicProfile();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get user');
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, updateData: IUpdateUserDTO): Promise<IUserResponse> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      return user.getPublicProfile();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update user');
    }
  }

  /**
   * Change user password
   */
  static async changePassword(userId: string, passwordData: IChangePasswordDTO): Promise<void> {
    try {
      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(passwordData.currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error(ERROR_MESSAGES.PASSWORD_MISMATCH);
      }

      // Update password
      user.password = passwordData.newPassword;
      await user.save();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to change password');
    }
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
    try {
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
    } catch (error) {
      throw new Error('Failed to get users');
    }
  }

  /**
   * Delete user (admin function)
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Verify user email
   */
  static async verifyEmail(userId: string): Promise<IUserResponse> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isEmailVerified: true },
        { new: true }
      );

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      return user.getPublicProfile();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to verify email');
    }
  }
}
