import { getBaseEmailTemplate } from './base-email.template';

/**
 * OTP Email Template
 * Displays the verification code for email verification
 */
export function getOtpEmailTemplate(otp: string, companyName: string): string {
  const content = `
            <div class="greeting">
                Verification Code Request
            </div>
            
            <div class="message">
                Hello ${companyName},<br><br>
                You've requested a verification code to complete your registration with SafeIn. Please use the code below to verify your email address and activate your account.
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <div style="display: inline-block; padding: 25px 40px; background: linear-gradient(135deg, #e3f2fd 0%, #f5f9ff 100%); border-radius: 12px; border: 2px dashed #1A73E8;">
                    <div style="font-size: 14px; color: #666666; margin-bottom: 10px; font-weight: 500; letter-spacing: 0.5px;">YOUR VERIFICATION CODE</div>
                    <div style="font-size: 42px; font-weight: 700; color: #1A73E8; letter-spacing: 8px; font-family: 'Courier New', monospace; line-height: 1.2;">
                        ${otp}
                    </div>
                </div>
            </div>
            
            <div class="security-note">
                <strong>⏱️ Important:</strong> This verification code will expire in <strong>10 minutes</strong> for security purposes. Please enter it promptly to complete your registration.
            </div>
            
            <div class="security-note security-warning">
                <strong>🔒 Security Notice:</strong> Never share this code with anyone. SafeIn staff will never ask for your verification code. If you didn't request this code, please ignore this email or contact our support team immediately if you have concerns about your account security.
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

