import { getBaseEmailTemplate } from './base-email.template';

/**
 * Password Reset Email Template
 * Displays the password reset link
 */
export function getPasswordResetEmailTemplate(resetUrl: string, companyName: string): string {
  const content = `
            <div class="greeting">
                Password Reset Request
            </div>
            
            <div class="message">
                Hello ${companyName},<br><br>
                We received a request to reset the password for your SafeIn account. If you made this request, please click the button below to create a new password. If you didn't request this, you can safely ignore this email.
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="${resetUrl}" class="action-button">Reset My Password</a>
            </div>
            
            <div class="info-box">
                <strong>Alternative Method:</strong> If the button above doesn't work, you can copy and paste the following link into your browser:<br><br>
                <a href="${resetUrl}">${resetUrl}</a>
            </div>
            
            <div class="security-note security-warning">
                <strong>⏱️ Expiration Notice:</strong> This password reset link will expire in <strong>1 hour</strong> for security reasons. If the link expires, you can request a new password reset from the login page.
            </div>
            
            <div class="security-note">
                <strong>🔒 Security Reminders:</strong><br>
                • Never share your password reset link with anyone<br>
                • SafeIn staff will never ask for your password or reset link<br>
                • If you didn't request this reset, your account remains secure<br>
                • If you continue to receive unexpected reset emails, please contact our support team immediately
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









