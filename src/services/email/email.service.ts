import nodemailer from 'nodemailer';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES, CONSTANTS } from '../../utils/constants';
import { getOtpEmailTemplate, getOtpEmailText } from '../../templates/email/otp-email.template';
import { getWelcomeEmailTemplate, getWelcomeEmailText } from '../../templates/email/welcome-email.template';
import { getAppointmentApprovalEmailTemplate, getAppointmentApprovalEmailText } from '../../templates/email/appointment-approval-email.template';
import { getAppointmentRejectionEmailTemplate, getAppointmentRejectionEmailText } from '../../templates/email/appointment-rejection-email.template';
import {
  getEmployeeAppointmentApprovalEmailTemplate,
  getEmployeeAppointmentApprovalEmailText,
  getEmployeeAppointmentRejectionEmailTemplate,
  getEmployeeAppointmentRejectionEmailText
} from '../../templates/email/employee-appointment-email.template';
import {
  getNewAppointmentRequestEmailTemplate,
  getNewAppointmentRequestEmailText
} from '../../templates/email/new-appointment-request-email.template';
import {
  getPasswordResetEmailTemplate,
  getPasswordResetEmailText
} from '../../templates/email/password-reset-email.template';
import {
  getAppointmentLinkEmailTemplate,
  getAppointmentLinkEmailText
} from '../../templates/email/appointment-link-email.template';
import {
  getAppointmentConfirmationEmailTemplate,
  getAppointmentConfirmationEmailText
} from '../../templates/email/appointment-confirmation-email.template';
import {
  getEmployeeSetupEmailTemplate,
  getEmployeeSetupEmailText
} from '../../templates/email/employee-setup-email.template';

export class EmailService {
  private static transporter: nodemailer.Transporter;
  private static isEmailServiceAvailable: boolean = false;
  private static brevoApiDisabled: boolean = false; // Track if Brevo API should be skipped

  /**
   * Initialize email transporter
   */
  static initializeTransporter(): nodemailer.Transporter {
    if (this.transporter && this.isEmailServiceAvailable) {
      return this.transporter;
    }

    const smtpConfig = {
      host: CONSTANTS.SMTP_HOST,
      port: CONSTANTS.SMTP_PORT,
      secure: CONSTANTS.SMTP_SECURE,
      auth: {
        user: CONSTANTS.SMTP_USER || '',
        pass: CONSTANTS.SMTP_PASS || ''
      },
      tls: {
        rejectUnauthorized: !CONSTANTS.SKIP_SMTP_VERIFY,
      },
      // Add timeout settings for production environments
      connectionTimeout: 60000, // 60 seconds - time to establish connection
      socketTimeout: 60000, // 60 seconds - time to wait for socket response
      greetingTimeout: 30000, // 30 seconds - time to wait for SMTP greeting
      // Retry configuration
      pool: true, // Use connection pooling for better performance
      maxConnections: 5, // Maximum number of connections in pool
      maxMessages: 100, // Maximum messages per connection
    } as nodemailer.TransportOptions;

    this.transporter = nodemailer.createTransport(smtpConfig);
    return this.transporter;
  }

  /**
   * Verify SMTP connection
   */
  static async verifyConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.initializeTransporter();
      }
      if (CONSTANTS.SKIP_SMTP_VERIFY) {
        this.isEmailServiceAvailable = true;
        return true;
      }

      await this.transporter.verify();
      this.isEmailServiceAvailable = true;
      return true;
    } catch (error: any) {
      console.error('SMTP connection failed:', error.message);
      this.isEmailServiceAvailable = false;

      if (error.code === 'EAUTH' && CONSTANTS.SMTP_HOST === 'smtp.gmail.com') {
        return await this.tryAlternativeSmtpConfigs();
      }

      return false;
    }
  }

  /**
   * Try alternative SMTP configurations
   */
  private static async tryAlternativeSmtpConfigs(): Promise<boolean> {
    const alternatives = [
      {
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: { user: CONSTANTS.SMTP_USER || '', pass: CONSTANTS.SMTP_PASS || '' }
      },
      {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: CONSTANTS.SMTP_USER || '', pass: CONSTANTS.SMTP_PASS || '' }
      }
    ];

    for (const config of alternatives) {
      try {
        // Add timeout settings to alternative configs as well
        const configWithTimeouts = {
          ...config,
          connectionTimeout: 60000,
          socketTimeout: 60000,
          greetingTimeout: 30000,
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
        };
        this.transporter = nodemailer.createTransport(configWithTimeouts);
        await this.transporter.verify();
        this.isEmailServiceAvailable = true;
        return true;
      } catch (error: any) {
        continue;
      }
    }

    this.isEmailServiceAvailable = false;
    return false;
  }

  /**
   * Send email using Brevo API
   */
  private static async sendWithBrevo(mail: { to: string; subject: string; html: string; from?: string; text?: string; fromName?: string; disableClickTracking?: boolean }) {
    if (!CONSTANTS.BREVO_API_KEY) throw new Error('BREVO_API_KEY not set');

    const fromEmail = mail.from || CONSTANTS.SMTP_FROM_EMAIL || CONSTANTS.SMTP_USER || 'no-reply@safein.app';
    const fromName = mail.fromName || CONSTANTS.SMTP_FROM_NAME || 'SafeIn Security Management';

    const emailPayload: any = {
      sender: {
        name: fromName,
        email: fromEmail,
      },
      to: [
        {
          email: mail.to,
        }
      ],
      subject: mail.subject,
      htmlContent: mail.html,
      textContent: mail.text || mail.html.replace(/<[^>]*>/g, ''),
      headers: {
        'X-Mailer': 'SafeIn Security Management System',
        'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      replyTo: {
        email: CONSTANTS.SMTP_FROM_EMAIL || fromEmail, // removed SMTP_REPLY_TO from constants as it wasn't there, using FROM_EMAIL
      },
    };

    // Disable click tracking for appointment links to prevent tracking URL issues
    // Brevo API format: tracking.clicks can be 'enabled', 'disabled', or boolean
    if (mail.disableClickTracking !== undefined) {
      emailPayload.tracking = {
        clicks: mail.disableClickTracking ? false : true,
        opens: true,
      };
    }

    // Add timeout for Brevo API call (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': CONSTANTS.BREVO_API_KEY,
        },
        body: JSON.stringify(emailPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Brevo API error: ${res.status} ${text}`);
      }

      const result = await res.json();
      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Brevo API request timeout after 30 seconds');
      }
      throw error;
    }
  }

  /**
   * Common function to send email with automatic provider selection
   * Priority: Brevo API > Resend API > SMTP
   */
  private static async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
    fromName?: string;
    logMessage?: string;
    disableClickTracking?: boolean;
  }): Promise<void> {
    const { to, subject, html, text, from, fromName, disableClickTracking } = options;

    // Priority 1: Use Brevo API if BREVO_API_KEY is set and not disabled
    // Brevo API is preferred because it's more reliable and faster than SMTP
    if (CONSTANTS.BREVO_API_KEY && !this.brevoApiDisabled) {
      try {
        console.log(`[EmailService] Using Brevo API to send email to ${to}`);
        await this.sendWithBrevo({
          to,
          subject,
          html,
          text,
          from,
          fromName: fromName || CONSTANTS.SMTP_FROM_NAME || 'SafeIn Security Management',
          disableClickTracking,
        });
        console.log(`[EmailService] Successfully sent email to ${to} via Brevo API`);
        return;
      } catch (brevoError: any) {
        // If it's an authentication error (401), disable Brevo for future attempts
        if (brevoError.message.includes('401') || brevoError.message.includes('unauthorized') || brevoError.message.includes('Key not found')) {
          this.brevoApiDisabled = true;
          console.warn('⚠ Brevo API key is invalid or expired. Disabling Brevo API and using SMTP fallback.');
        } else {
          console.error(`[EmailService] Brevo API failed for ${to}:`, brevoError.message);
          console.warn(`[EmailService] Falling back to SMTP for ${to}`);
        }
        // Don't throw here, try SMTP fallback
      }
    } else if (CONSTANTS.BREVO_API_KEY && this.brevoApiDisabled) {
      console.warn('[EmailService] Brevo API is disabled (invalid key). Using SMTP fallback.');
    } else if (!CONSTANTS.BREVO_API_KEY) {
      console.log('[EmailService] BREVO_API_KEY not set. Using SMTP.');
    }

    // Priority 2: Use Resend API if RESEND_API_KEY is set
    // Skipping Resend replacement as it is not in CONSTANTS and likely unused

    // Priority 3: Fallback to SMTP
    if (!this.transporter) {
      this.initializeTransporter();
    }

    const fromEmail = from || CONSTANTS.SMTP_FROM_EMAIL || CONSTANTS.SMTP_USER || 'no-reply@safein.app';
    const fromNameValue = fromName || CONSTANTS.SMTP_FROM_NAME || 'SafeIn Security Management';

    const mailOptions = {
      from: `"${fromNameValue}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      // Anti-spam headers
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'List-Unsubscribe': `<mailto:${CONSTANTS.SMTP_FROM_EMAIL || fromEmail}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Precedence': 'bulk',
        'X-Mailer': 'SafeIn Security Management System',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'Return-Path': fromEmail,
      },
      // Reply-to header
      replyTo: CONSTANTS.SMTP_FROM_EMAIL || fromEmail,
    };

    try {
      if (this.isEmailServiceAvailable) {
        // Use sendMail with timeout wrapper
        await Promise.race([
          this.transporter.sendMail(mailOptions),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('SMTP send timeout after 60 seconds')), 60000)
          )
        ]);
        return;
      }

      const isConnected = await this.verifyConnection();
      if (isConnected) {
        // Use sendMail with timeout wrapper
        await Promise.race([
          this.transporter.sendMail(mailOptions),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('SMTP send timeout after 60 seconds')), 60000)
          )
        ]);
        return;
      }

      throw new Error('SMTP connection not available. Please check SMTP configuration.');
    } catch (smtpError: any) {
      console.error(`[EmailService] Failed to send email via SMTP to ${to}:`, smtpError.message);

      // If SMTP fails but BREVO_API_KEY is available, try Brevo as fallback (all environments)
      if (CONSTANTS.BREVO_API_KEY && !this.brevoApiDisabled) {
        console.warn(`[EmailService] SMTP failed for ${to}, attempting Brevo API fallback...`);
        try {
          await this.sendWithBrevo({
            to,
            subject,
            html,
            text,
            from,
            fromName: fromName || CONSTANTS.SMTP_FROM_NAME || 'SafeIn Security Management',
            disableClickTracking,
          });
          console.log(`[EmailService] Successfully sent email to ${to} via Brevo API fallback`);
          return;
        } catch (brevoError: any) {
          console.error(`[EmailService] Brevo API fallback also failed for ${to}:`, brevoError.message);
          // Continue to throw original SMTP error
        }
      }

      throw smtpError;
    }
  }



  /**
   * Send OTP email
   * Note: Uses "SafeIn Security Management" as fromName (only for registration)
   */
  static async sendOtpEmail(email: string, otp: string, companyName: string): Promise<void> {
    try {
      await this.sendEmail({
        to: email,
        subject: 'SafeIn Registration - Verify Your Email',
        html: getOtpEmailTemplate(otp, companyName),
        text: getOtpEmailText(otp, companyName),
        fromName: 'SafeIn Security Management', // Explicitly use "SafeIn Security Management" for registration
        logMessage: 'OTP email',
      });
    } catch (error: any) {
      console.error('Failed to send OTP email:', error.message);

      if (CONSTANTS.NODE_ENV === 'development') {
        console.warn('Continuing in development mode despite email error');
        return;
      }

      throw new AppError(`Failed to send OTP email: ${error.message}`, ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Send welcome email after successful registration
   * Note: Uses "SafeIn Security Management" as fromName (only for registration)
   */
  static async sendWelcomeEmail(email: string, companyName: string): Promise<void> {
    try {
      await this.sendEmail({
        to: email,
        subject: 'Welcome to SafeIn - Your Account is Ready!',
        html: getWelcomeEmailTemplate(companyName),
        text: getWelcomeEmailText(companyName),
        fromName: 'SafeIn Security Management', // Explicitly use "SafeIn Security Management" for registration
        logMessage: 'Welcome email',
      });
    } catch (error: any) {
      console.error('Failed to send welcome email:', error.message);
    }
  }

  /**
   * Send appointment approval email to visitor
   */
  static async sendAppointmentApprovalEmail(
    visitorEmail: string,
    visitorName: string,
    employeeName: string,
    scheduledDate: Date,
    scheduledTime: string,
    companyName?: string
  ): Promise<void> {
    try {
      // Use company name if provided, otherwise fallback to default
      const fromName = companyName || CONSTANTS.SMTP_FROM_NAME || 'SafeIn';
      await this.sendEmail({
        to: visitorEmail,
        subject: 'Appointment Approved - SafeIn',
        html: getAppointmentApprovalEmailTemplate(visitorName, employeeName, scheduledDate, scheduledTime),
        text: getAppointmentApprovalEmailText(visitorName, employeeName, scheduledDate, scheduledTime),
        fromName,
        logMessage: 'Appointment approval email',
      });
    } catch (error: any) {
      console.error('Failed to send appointment approval email:', error.message);
    }
  }

  /**
   * Send appointment rejection email to visitor
   */
  static async sendAppointmentRejectionEmail(
    visitorEmail: string,
    visitorName: string,
    employeeName: string,
    scheduledDate: Date,
    scheduledTime: string,
    companyName?: string
  ): Promise<void> {
    try {
      // Use company name if provided, otherwise fallback to default
      const fromName = companyName || CONSTANTS.SMTP_FROM_NAME || 'SafeIn';
      await this.sendEmail({
        to: visitorEmail,
        subject: 'Appointment Update - SafeIn',
        html: getAppointmentRejectionEmailTemplate(visitorName, employeeName, scheduledDate, scheduledTime),
        text: getAppointmentRejectionEmailText(visitorName, employeeName, scheduledDate, scheduledTime),
        fromName,
        logMessage: 'Appointment rejection email',
      });
    } catch (error: any) {
      console.error('Failed to send appointment rejection email:', error.message);
    }
  }

  /**
   * Send appointment approval email to employee
   */
  static async sendEmployeeAppointmentApprovalEmail(
    employeeEmail: string,
    employeeName: string,
    visitorName: string,
    scheduledDate: Date,
    scheduledTime: string,
    companyName?: string
  ): Promise<void> {
    try {
      // Use company name if provided, otherwise fallback to default
      const fromName = companyName || CONSTANTS.SMTP_FROM_NAME || 'SafeIn';
      await this.sendEmail({
        to: employeeEmail,
        subject: 'Appointment Approved - SafeIn',
        html: getEmployeeAppointmentApprovalEmailTemplate(employeeName, visitorName, scheduledDate, scheduledTime),
        text: getEmployeeAppointmentApprovalEmailText(employeeName, visitorName, scheduledDate, scheduledTime),
        fromName,
        logMessage: 'Employee appointment approval email',
      });
    } catch (error: any) {
      console.error('Failed to send appointment approval email to employee:', error.message);
      throw error;
    }
  }

  /**
   * Send appointment rejection email to employee
   */
  static async sendEmployeeAppointmentRejectionEmail(
    employeeEmail: string,
    employeeName: string,
    visitorName: string,
    scheduledDate: Date,
    scheduledTime: string,
    companyName?: string
  ): Promise<void> {
    try {
      // Use company name if provided, otherwise fallback to default
      const fromName = companyName || CONSTANTS.SMTP_FROM_NAME || 'SafeIn';
      await this.sendEmail({
        to: employeeEmail,
        subject: 'Appointment Rejected - SafeIn',
        html: getEmployeeAppointmentRejectionEmailTemplate(employeeName, visitorName, scheduledDate, scheduledTime),
        text: getEmployeeAppointmentRejectionEmailText(employeeName, visitorName, scheduledDate, scheduledTime),
        fromName,
        logMessage: 'Employee appointment rejection email',
      });
    } catch (error: any) {
      console.error('Failed to send appointment rejection email to employee:', error.message);
      throw error;
    }
  }

  /**
   * Send new appointment request email to employee
   */
  static async sendNewAppointmentRequestEmail(
    employeeEmail: string,
    employeeName: string,
    visitorDetails: any,
    scheduledDate: Date,
    scheduledTime: string,
    purpose: string,
    approvalToken: string,
    companyName?: string,
    companyLogo?: string
  ): Promise<void> {
    try {
      // Use company name if provided, otherwise fallback to default
      const fromName = companyName || CONSTANTS.SMTP_FROM_NAME || 'SafeIn';
      await this.sendEmail({
        to: employeeEmail,
        subject: 'New Appointment Request - SafeIn',
        html: getNewAppointmentRequestEmailTemplate(employeeName, visitorDetails, scheduledDate, scheduledTime, purpose, approvalToken, companyLogo),
        text: getNewAppointmentRequestEmailText(employeeName, visitorDetails, scheduledDate, scheduledTime, purpose, approvalToken),
        fromName,
        logMessage: 'New appointment request email',
      });
    } catch (error: any) {
      console.error('Failed to send new appointment request email:', error.message);
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, resetUrl: string, companyName: string): Promise<void> {
    try {
      await this.sendEmail({
        to: email,
        subject: 'Reset Your Password - SafeIn',
        html: getPasswordResetEmailTemplate(resetUrl, companyName),
        text: getPasswordResetEmailText(resetUrl, companyName),
        logMessage: 'Password reset email',
      });
    } catch (error: any) {
      console.error('Failed to send password reset email:', error.message);

      if (CONSTANTS.NODE_ENV === 'development') {
        console.warn('Continuing in development mode despite email error');
        return;
      }

      throw new AppError(`Failed to send password reset email: ${error.message}`, ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Send appointment booking link email
   */
  static async sendAppointmentLinkEmail(
    visitorEmail: string,
    employeeName: string,
    bookingUrl: string,
    expiresAt: Date,
    companyName?: string
  ): Promise<void> {
    try {
      // Use company name if provided, otherwise fallback to default
      const fromName = companyName || CONSTANTS.SMTP_FROM_NAME || 'SafeIn';
      await this.sendEmail({
        to: visitorEmail,
        subject: 'Book Your Appointment - SafeIn',
        html: getAppointmentLinkEmailTemplate(employeeName, bookingUrl, expiresAt),
        text: getAppointmentLinkEmailText(employeeName, bookingUrl, expiresAt),
        fromName,
        logMessage: 'Appointment link email',
        disableClickTracking: true, // Disable click tracking to prevent tracking URL issues
      });
    } catch (error: any) {
      console.error('Failed to send appointment link email:', error.message);
      throw error;
    }
  }

  /**
   * Send appointment confirmation email to visitor
   */
  static async sendAppointmentConfirmationEmail(
    visitorEmail: string,
    visitorName: string,
    employeeName: string,
    scheduledDate: Date,
    scheduledTime: string,
    purpose: string,
    companyName?: string,
    companyLogo?: string
  ): Promise<void> {
    try {
      // Use company name if provided, otherwise fallback to default
      const fromName = companyName || CONSTANTS.SMTP_FROM_NAME || 'SafeIn';
      await this.sendEmail({
        to: visitorEmail,
        subject: 'Appointment Request Submitted - SafeIn',
        html: getAppointmentConfirmationEmailTemplate(visitorName, employeeName, scheduledDate, scheduledTime, purpose, companyLogo),
        text: getAppointmentConfirmationEmailText(visitorName, employeeName, scheduledDate, scheduledTime, purpose),
        fromName,
        logMessage: 'Appointment confirmation email to visitor',
      });
    } catch (error: any) {
      console.error('Failed to send appointment confirmation email to visitor:', error.message);
      if (CONSTANTS.NODE_ENV === 'development') {
        console.warn('Continuing in development mode despite email error');
        return;
      }
      // Don't throw error, just log it - visitor confirmation is not critical
    }
  }

  /**
   * Send password reset confirmation email
   */
  static async sendPasswordResetConfirmationEmail(email: string, companyName: string): Promise<void> {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1A73E8;">Password Reset Successful</h2>
          <p>Hello ${companyName},</p>
          <p>Your password has been successfully reset.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <p>Best regards,<br/>SafeIn Security Team</p>
        </div>
      `;
      const textContent = `Password Reset Successful\n\nHello ${companyName},\n\nYour password has been successfully reset.\n\nIf you did not make this change, please contact our support team immediately.\n\nBest regards,\nSafeIn Security Team`;

      await this.sendEmail({
        to: email,
        subject: 'Password Reset Successful - SafeIn',
        html: htmlContent,
        text: textContent,
        logMessage: 'Password reset confirmation email',
      });
    } catch (error: any) {
      console.error('Failed to send password reset confirmation email:', error.message);
    }
  }
  /**
   * Send Safein User Credentials Email
   */
  static async sendSafeinUserCredentialsEmail(email: string, password: string, companyName: string): Promise<void> {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1A73E8; text-align: center;">Welcome to SafeIn Security Cloud</h2>
          <p>Hello <strong>${companyName}</strong>,</p>
          <p>Your account has been successfully created by the Super Admin.</p>
          <p>Here are your login credentials:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
          </div>
          <p>Please login and change your password immediately.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${CONSTANTS.FRONTEND_URL}/login" style="background-color: #1A73E8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Login to Dashboard</a>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
            This email contains sensitive information. Please delete it after logging in.
          </p>
        </div>
      `;
      const textContent = `Welcome to SafeIn Security Cloud\n\nHello ${companyName},\n\nYour account has been successfully created.\n\nLogin Credentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease login and change your password immediately.\n\nLogin here: ${CONSTANTS.FRONTEND_URL}/login`;

      await this.sendEmail({
        to: email,
        subject: 'Your SafeIn Account Credentials',
        html: htmlContent,
        text: textContent,
        logMessage: 'Safein user credentials email',
      });
    } catch (error: any) {
      console.error('Failed to send credentials email:', error.message);
      // Don't throw to avoid blocking user creation response, but log it
    }
  }

  /**
   * Send Employee Setup Email
   */
  static async sendEmployeeSetupEmail(
    email: string,
    employeeName: string,
    setupUrl: string
  ): Promise<void> {
    try {
      console.log(`[EmailService] Preparing to send employee setup email to: ${email}`);
      console.log(`[EmailService] Email service available: ${this.isEmailServiceAvailable}`);
      console.log(`[EmailService] SMTP Host: ${CONSTANTS.SMTP_HOST || 'Not configured'}`);
      console.log(`[EmailService] Brevo API Key: ${CONSTANTS.BREVO_API_KEY ? 'Configured' : 'Not configured'}`);

      const htmlContent = getEmployeeSetupEmailTemplate(employeeName, setupUrl);
      const textContent = getEmployeeSetupEmailText(employeeName, setupUrl);

      console.log(`[EmailService] Email content generated, sending email...`);

      await this.sendEmail({
        to: email,
        subject: 'Welcome to SafeIn - Set Up Your Account',
        html: htmlContent,
        text: textContent,
        logMessage: 'Employee setup email',
      });

      console.log(`[EmailService] Employee setup email sent successfully to: ${email}`);
    } catch (error: any) {
      console.error(`[EmailService] Failed to send employee setup email to ${email}:`, error.message);
      console.error(`[EmailService] Error stack:`, error.stack);
      console.error(`[EmailService] Error code:`, error.code);
      // Don't throw to avoid blocking employee creation response, but log it
    }
  }
}
