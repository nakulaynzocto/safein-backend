import { getBaseEmailTemplate } from './base-email.template';

/**
 * Password Reset Email Template
 * Displays the password reset link
 */
export function getPasswordResetEmailTemplate(resetUrl: string, companyName: string): string {
  const content = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 100px; height: 100px; background-color: #fef2f2; border-radius: 50%; padding: 20px; box-sizing: border-box; margin: 0 auto;">
                    <div style="width: 100%; height: 100%; background-color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <span style="font-size: 40px;">🔐</span>
                    </div>
                </div>
            </div>

            <div class="greeting" style="text-align: center;">
                Password Reset Request
            </div>
            
            <div class="message">
                Hello <strong>${companyName}</strong>,<br><br>
                We received a request to reset the password for your <strong>${companyName}</strong> account. If you made this request, please click the button below to create a new password. If you didn't request this, you can safely ignore this email.
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
  `;

  return getBaseEmailTemplate(content, `Reset Your Password - ${companyName}`, companyName);
}

export function getPasswordResetEmailText(resetUrl: string, companyName: string): string {
  return `
Reset Your Password - ${companyName}

Hello ${companyName},

You requested to reset your password for your ${companyName} account.

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
${companyName} Team

This is an automated message. Please do not reply to this email.

${companyName} Security Management System
Professional Visitor Management Solutions
  `;
}






