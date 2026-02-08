import { getBaseEmailTemplate } from './base-email.template';

/**
 * OTP Email Template
 * Displays the verification code for email verification
 */
export function getOtpEmailTemplate(otp: string, companyName: string): string {
    const content = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 100px; height: 100px; background-color: #e3f2fd; border-radius: 50%; padding: 20px; box-sizing: border-box; margin: 0 auto;">
                    <div style="width: 100%; height: 100%; background-color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <span style="font-size: 40px;">🔒</span>
                    </div>
                </div>
            </div>

            <div class="greeting" style="text-align: center;">
                Verification Code Request
            </div>
            
            <div class="message">
                Hello <strong>${companyName}</strong>,<br><br>
                You've requested a verification code to complete your registration with <strong>${companyName}</strong>. Please use the code below to verify your email address.
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <div style="display: inline-block; padding: 25px 40px; background-color: #f0f9ff; border-radius: 12px; border: 2px dashed #3882a5;">
                    <div style="font-size: 13px; color: #475569; margin-bottom: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Your Verification Code</div>
                    <div style="font-size: 48px; font-weight: 800; color: #074463; letter-spacing: 12px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.1;">
                        ${otp}
                    </div>
                </div>
            </div>
            
            <div class="security-note">
                <strong>⏱️ Important:</strong> This verification code will expire in <strong>10 minutes</strong> for security purposes.
            </div>
            
            <div class="security-note">
                <strong>🔒 Security Notice:</strong> Never share this code with anyone. ${companyName} staff will never ask for your verification code.
            </div>
  `;

    return getBaseEmailTemplate(content, `${companyName} Verification`, companyName);
}

export function getOtpEmailText(otp: string, companyName: string): string {
    return `
${companyName} Registration Verification

Hello ${companyName},

Thank you for registering with ${companyName} Security Management System.

Your verification code is: ${otp}

This code will expire in 10 minutes.

Enter this code in the registration form to complete your account setup.

Important Security Notes:
- This OTP is valid for 10 minutes only
- Never share this code with anyone
- If you didn't request this registration, please ignore this email

If you have any questions or need assistance, please contact our support team.

Best regards,
${companyName} Team

This is an automated message. Please do not reply to this email.

${companyName} Security Management System
Professional Visitor Management Solutions
  `;
}

/**
 * Visitor Entry Code Email Template
 * Displays the entry code for visitor verification (no expiration for special visitors)
 */
export function getVisitorOtpEmailTemplate(otp: string, visitorName: string, companyName: string): string {
    const content = `
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; width: 100px; height: 100px; background-color: #e3f2fd; border-radius: 50%; padding: 20px; box-sizing: border-box; margin: 0 auto;">
                    <div style="width: 100%; height: 100%; background-color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <span style="font-size: 40px;">🔒</span>
                    </div>
                </div>
            </div>

            <div class="greeting" style="text-align: center;">
                Visitor Entry Code
            </div>
            
            <div class="message">
                Hello <strong>${visitorName}</strong>,<br><br>
                You have been registered as a special visitor at <strong>${companyName}</strong>. Please use the entry code below at the reception to verify your identity.
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <div style="display: inline-block; padding: 25px 40px; background-color: #f0f9ff; border-radius: 12px; border: 2px dashed #3882a5;">
                    <div style="font-size: 13px; color: #475569; margin-bottom: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Your Entry Code</div>
                    <div style="font-size: 48px; font-weight: 800; color: #074463; letter-spacing: 12px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.1;">
                        ${otp}
                    </div>
                </div>
            </div>
            
            <div class="security-note">
                <strong>✨ Note:</strong> This entry code is valid for your upcoming visit.
            </div>
            
            <div class="security-note">
                <strong>🔒 Security Notice:</strong> Please keep this code handy for quick entry.
            </div>
  `;

    return getBaseEmailTemplate(content, `${companyName} Visitor Entry Code`, companyName);
}

export function getVisitorOtpEmailText(otp: string, visitorName: string, companyName: string): string {
    return `
${companyName} Visitor Entry Code

Hello ${visitorName},

You have been registered as a special visitor at ${companyName}.

Your Entry Code is: ${otp}

This entry code is valid for your upcoming visit and does not expire.

Please present this code at the reception.

Best regards,
${companyName} Team
  `;
}

