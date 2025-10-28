import { getBaseEmailTemplate } from './base-email.template';

/**
 * OTP Email Template
 * Displays the verification code for email verification
 */
export function getOtpEmailTemplate(otp: string, companyName: string): string {
  const content = `
            <div class="greeting">
                Hi ${companyName},
            </div>
            
            <div class="message">
                Here's the confirmation code you requested:
            </div>
            
            <div style="font-size: 32px; font-weight: 600; color: #1A73E8; letter-spacing: 4px; margin: 20px 0; font-family: 'Courier New', monospace;">
                ${otp}
            </div>
            
            <div class="security-note">
                If you didn't request this, you can ignore this email or let us know.
            </div>
  `;
  
  return getBaseEmailTemplate(content, 'SafeIn Verification');
}

export function getOtpEmailText(otp: string, companyName: string): string {
  return `
SafeIn Registration Verification

Hello ${companyName},

Thank you for registering with SafeIn Security Management System.

Your verification code is: ${otp}

This code will expire in 10 minutes.

Enter this code in the registration form to complete your account setup.

Important Security Notes:
- This OTP is valid for 10 minutes only
- Never share this code with anyone
- If you didn't request this registration, please ignore this email

If you have any questions or need assistance, please contact our support team.

Best regards,
SafeIn Security Team

This is an automated message. Please do not reply to this email.

SafeIn Security Management System
Professional Visitor Management Solutions
  `;
}

