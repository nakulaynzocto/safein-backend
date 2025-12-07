import { getBaseEmailTemplate } from './base-email.template';

/**
 * Password Reset Email Template
 * Displays the password reset link
 */
export function getPasswordResetEmailTemplate(resetUrl: string, companyName: string): string {
  const content = `
            <div class="greeting">
                Hi ${companyName},
            </div>
            
            <div class="message">
                You requested to reset your password. Click the button below to reset it:
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; padding: 14px 28px; background-color: #1A73E8; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Reset Password
                </a>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px; font-size: 13px; color: #666;">
                <strong>Or copy and paste this link:</strong><br/>
                <a href="${resetUrl}" style="color: #1A73E8; word-break: break-all;">${resetUrl}</a>
            </div>
            
            <div class="security-note" style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <strong>⚠️ Security Notice:</strong><br/>
                This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact support if you have concerns.
            </div>
  `;
  
  return getBaseEmailTemplate(content, 'Reset Your Password - SafeIn');
}

export function getPasswordResetEmailText(resetUrl: string, companyName: string): string {
  return `
Reset Your Password - SafeIn

Hello ${companyName},

You requested to reset your password for your SafeIn account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

Important Security Notes:
- This link is valid for 1 hour only
- Never share this link with anyone
- If you didn't request this password reset, please ignore this email
- If you continue to receive these emails, please contact our support team

If you have any questions or need assistance, please contact our support team.

Best regards,
SafeIn Security Team

This is an automated message. Please do not reply to this email.

SafeIn Security Management System
Professional Visitor Management Solutions
  `;
}







