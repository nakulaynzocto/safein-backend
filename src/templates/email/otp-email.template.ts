import { getBaseEmailTemplate } from './base-email.template';

/**
 * OTP Email Template
 * Displays the verification code for email verification
 */
export function getOtpEmailTemplate(otp: string, companyName: string): string {
    const content = `
            <div class="greeting">
                Verify your email address
            </div>
            
            <div class="message">
                Hello,<br><br>
                Use the following verification code to complete your registration with <strong>${companyName}</strong>. This code is required to verify your identity.
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; padding: 16px 32px; background-color: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 4px;">
                    <div style="font-size: 13px; color: #5f6368; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Verification Code</div>
                    <div style="font-size: 36px; font-weight: 500; color: #202124; letter-spacing: 8px; font-family: monospace;">
                        ${otp}
                    </div>
                </div>
            </div>
            
            <div class="security-note" style="text-align: center;">
                This code will expire in <strong>10 minutes</strong>.
            </div>
            
            <div class="message" style="font-size: 14px; color: #5f6368; border-top: 1px solid #f1f3f4; padding-top: 24px;">
                If you didn't request this code, you can safely ignore this email. Someone might have typed your email address by mistake.
            </div>
  `;

    return getBaseEmailTemplate(content, `Verify your email address`, companyName);
}

export function getOtpEmailText(otp: string, companyName: string): string {
    return `
Verify your email address

Hello,

Use the following verification code to complete your registration with ${companyName}.

Verification Code: ${otp}

This code will expire in 10 minutes.

If you didn't request this code, you can safely ignore this email.

Best regards,
${companyName} Team
  `;
}

/**
 * Visitor Entry Code Email Template
 * Displays the entry code for visitor verification
 */
export function getVisitorOtpEmailTemplate(otp: string, visitorName: string, companyName: string): string {
    const content = `
            <div class="greeting">
                Your entry code for ${companyName}
            </div>
            
            <div class="message">
                Hello <strong>${visitorName}</strong>,<br><br>
                You have been registered as a visitor at <strong>${companyName}</strong>. Please present the entry code below at the reception when you arrive.
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; padding: 16px 32px; background-color: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 4px;">
                    <div style="font-size: 13px; color: #5f6368; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Entry Code</div>
                    <div style="font-size: 36px; font-weight: 500; color: #202124; letter-spacing: 8px; font-family: monospace;">
                        ${otp}
                    </div>
                </div>
            </div>
            
            <div class="security-note" style="text-align: center;">
                Please keep this code handy for a smooth entry process.
            </div>
  `;

    return getBaseEmailTemplate(content, `Visitor Entry Code`, companyName);
}

export function getVisitorOtpEmailText(otp: string, visitorName: string, companyName: string): string {
    return `
Visitor Entry Code - ${companyName}

Hello ${visitorName},

You have been registered as a visitor at ${companyName}.

Your Entry Code is: ${otp}

Please present this code at the reception when you arrive.

Best regards,
${companyName} Team
  `;
}


