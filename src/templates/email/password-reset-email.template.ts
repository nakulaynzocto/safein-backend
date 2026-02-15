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
                Hello,<br><br>
                We received a request to reset the password for your <strong>${companyName}</strong> account. To create a new password, click the button below:
            </div>
            
            <div class="action-button-container">
                <a href="${resetUrl}" class="action-button">Reset Password</a>
            </div>
            
            <div class="security-note" style="text-align: center;">
                This link will expire in <strong>1 hour</strong> for security reasons.
            </div>

            <div class="message" style="font-size: 14px; color: #5f6368; border-top: 1px solid #f1f3f4; padding-top: 24px;">
                If you didn't request this reset, you can safely ignore this email. Your password will remain unchanged.
            </div>
            
            <div style="font-size: 12px; color: #bdc1c6; margin-top: 16px; word-break: break-all;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                ${resetUrl}
            </div>
  `;

    return getBaseEmailTemplate(content, `Reset Your Password`, companyName);
}

export function getPasswordResetEmailText(resetUrl: string, companyName: string): string {
    return `
Password Reset Request

Hello,

We received a request to reset your password for your ${companyName} account.

Reset your password by clicking here:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this reset, you can safely ignore this email.

Best regards,
${companyName} Team
  `;
}







