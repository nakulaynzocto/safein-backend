import { getRedisClient } from '../../config/redis.config';
import { ICreateUserDTO } from '../../types/user/user.types';

const OTP_PREFIX = 'otp:';
const OTP_TTL_SECONDS = 10 * 60; // 10 minutes

interface OtpData {
  otp: string;
  expiresAt: Date;
  userData: ICreateUserDTO;
}

export class RedisOtpService {
  /**
   * Generate Redis key for OTP
   */
  private static getOtpKey(email: string): string {
    return `${OTP_PREFIX}${email}`;
  }

  /**
   * Store OTP in Redis
   */
  static async storeOtp(email: string, otpData: OtpData): Promise<void> {
    try {
      const redis = getRedisClient();
      const key = this.getOtpKey(email);
      
      const dataToStore = {
        otp: otpData.otp,
        expiresAt: otpData.expiresAt.toISOString(),
        userData: otpData.userData,
      };

      await redis.setex(key, OTP_TTL_SECONDS, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to store OTP in Redis:', error);
      throw error;
    }
  }

  /**
   * Get OTP from Redis
   */
  static async getOtp(email: string): Promise<OtpData | null> {
    try {
      const redis = getRedisClient();
      const key = this.getOtpKey(email);
      
      const data = await redis.get(key);
      
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);
      return {
        otp: parsed.otp,
        expiresAt: new Date(parsed.expiresAt),
        userData: parsed.userData,
      };
    } catch (error) {
      console.error('Failed to get OTP from Redis:', error);
      return null;
    }
  }

  /**
   * Delete OTP from Redis
   */
  static async deleteOtp(email: string): Promise<void> {
    try {
      const redis = getRedisClient();
      const key = this.getOtpKey(email);
      await redis.del(key);
    } catch (error) {
      console.error('Failed to delete OTP from Redis:', error);
      // Don't throw - deletion failure is not critical
    }
  }

  /**
   * Update OTP in Redis (for resend)
   */
  static async updateOtp(email: string, otpData: Partial<OtpData>): Promise<void> {
    try {
      const existing = await this.getOtp(email);
      if (!existing) {
        throw new Error('OTP not found');
      }

      const updated: OtpData = {
        otp: otpData.otp || existing.otp,
        expiresAt: otpData.expiresAt || existing.expiresAt,
        userData: otpData.userData || existing.userData,
      };

      await this.storeOtp(email, updated);
    } catch (error) {
      console.error('Failed to update OTP in Redis:', error);
      throw error;
    }
  }

  /**
   * Check if OTP exists
   */
  static async otpExists(email: string): Promise<boolean> {
    try {
      const redis = getRedisClient();
      const key = this.getOtpKey(email);
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Failed to check OTP existence in Redis:', error);
      return false;
    }
  }
}

