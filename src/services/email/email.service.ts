import nodemailer from 'nodemailer';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils/constants';
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
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER || process.env.SMTP_USER || '',
        pass: process.env.MAIL_PASS || process.env.SMTP_PASS || ''
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED === 'true' ? true : false,
      },
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
      if (process.env.SKIP_SMTP_VERIFY === 'true') {
        this.isEmailServiceAvailable = true;
        return true;
      }
      
      await this.transporter.verify();
      this.isEmailServiceAvailable = true;
      return true;
    } catch (error: any) {
      console.error('SMTP connection failed:', error.message);
      this.isEmailServiceAvailable = false;
      
      if (error.code === 'EAUTH' && process.env.SMTP_HOST === 'smtp.gmail.com') {
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
        auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' }
      },
      {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' }
      }
    ];

    for (const config of alternatives) {
      try {
        this.transporter = nodemailer.createTransport(config);
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
  private static async sendWithBrevo(mail: { to: string; subject: string; html: string; from?: string; text?: string; fromName?: string }) {
    if (!process.env.BREVO_API_KEY) throw new Error('BREVO_API_KEY not set');
    
    const fromEmail = mail.from || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app';
    const fromName = mail.fromName || process.env.SMTP_FROM_NAME || 'SafeIn Security Management';
    
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
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
          email: process.env.SMTP_REPLY_TO || fromEmail,
        },
      }),
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Brevo API error: ${res.status} ${text}`);
    }
    
    const result = await res.json();
    return result;
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
  }): Promise<void> {
    const { to, subject, html, text, from, fromName, logMessage } = options;

    // Priority 1: Use Brevo API if BREVO_API_KEY is set and not disabled
    if (process.env.BREVO_API_KEY && !this.brevoApiDisabled) {
      try {
        await this.sendWithBrevo({
          to,
          subject,
          html,
          text,
          from,
          fromName: fromName || process.env.SMTP_FROM_NAME || 'SafeIn Security Management',
        });
        console.log(`✓ ${logMessage || 'Email'} sent via Brevo API`);
        return;
      } catch (brevoError: any) {
        // If it's an authentication error (401), disable Brevo for future attempts
        if (brevoError.message.includes('401') || brevoError.message.includes('unauthorized') || brevoError.message.includes('Key not found')) {
          this.brevoApiDisabled = true;
          console.warn('⚠ Brevo API key is invalid or expired. Disabling Brevo API and using SMTP fallback.');
        } else {
          console.error('Brevo API failed:', brevoError.message);
        }
        // Don't throw here, try fallback
      }
    }

    // Priority 2: Use Resend API if RESEND_API_KEY is set
    if (process.env.RESEND_API_KEY) {
      try {
        await this.sendWithResend({
          to,
          subject,
          html,
          text,
          from,
        });
        console.log(`✓ ${logMessage || 'Email'} sent via Resend API`);
        return;
      } catch (resendError: any) {
        console.error('Resend API failed:', resendError.message);
        // Don't throw here, try SMTP fallback
      }
    }

    // Priority 3: Fallback to SMTP
    if (!this.transporter) {
      this.initializeTransporter();
    }

    const fromEmail = from || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app';
    const fromNameValue = fromName || process.env.SMTP_FROM_NAME || 'SafeIn Security Management';

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
        'List-Unsubscribe': `<mailto:${process.env.SMTP_FROM_EMAIL || fromEmail}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Precedence': 'bulk',
        'X-Mailer': 'SafeIn Security Management System',
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'Return-Path': fromEmail,
      },
      // Reply-to header
      replyTo: process.env.SMTP_REPLY_TO || fromEmail,
    };

    try {
      if (this.isEmailServiceAvailable) {
        await this.transporter.sendMail(mailOptions);
        console.log(`✓ ${logMessage || 'Email'} sent via SMTP`);
        return;
      }

      // Try to verify connection if not available
      const isConnected = await this.verifyConnection();
      if (isConnected) {
        await this.transporter.sendMail(mailOptions);
        console.log(`✓ ${logMessage || 'Email'} sent via SMTP (after verification)`);
        return;
      }

      throw new Error('SMTP connection not available');
    } catch (smtpError: any) {
      console.error(`Failed to send email via SMTP:`, smtpError.message);
      throw smtpError;
    }
  }

  private static async sendWithResend(mail: { to: string; subject: string; html: string; from?: string; text?: string }) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: mail.from || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app',
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        headers: {
          'X-Mailer': 'SafeIn Security Management System',
          'List-Unsubscribe': `<mailto:${mail.from || process.env.SMTP_FROM_EMAIL || 'no-reply@safein.app'}?subject=unsubscribe>`,
        },
        reply_to: process.env.SMTP_REPLY_TO || mail.from || process.env.SMTP_FROM_EMAIL || 'no-reply@safein.app',
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend error: ${res.status} ${text}`);
    }
  }

  /**
   * Send OTP email
   */
  static async sendOtpEmail(email: string, otp: string, companyName: string): Promise<void> {
    try {
      await this.sendEmail({
        to: email,
        subject: 'SafeIn Registration - Verify Your Email',
        html: getOtpEmailTemplate(otp, companyName),
        text: getOtpEmailText(otp, companyName),
        logMessage: 'OTP email',
      });
    } catch (error: any) {
      console.error('Failed to send OTP email:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        console.warn('Continuing in development mode despite email error');
        return;
      }
      
      throw new AppError(`Failed to send OTP email: ${error.message}`, ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Send welcome email after successful registration
   */
  static async sendWelcomeEmail(email: string, companyName: string): Promise<void> {
    try {
      await this.sendEmail({
        to: email,
        subject: 'Welcome to SafeIn - Your Account is Ready!',
        html: getWelcomeEmailTemplate(companyName),
        text: getWelcomeEmailText(companyName),
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
    scheduledTime: string
  ): Promise<void> {
    try {
      await this.sendEmail({
        to: visitorEmail,
        subject: 'Appointment Approved - SafeIn',
        html: getAppointmentApprovalEmailTemplate(visitorName, employeeName, scheduledDate, scheduledTime),
        text: getAppointmentApprovalEmailText(visitorName, employeeName, scheduledDate, scheduledTime),
        fromName: process.env.SMTP_FROM_NAME || 'SafeIn',
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
    scheduledTime: string
  ): Promise<void> {
    try {
      await this.sendEmail({
        to: visitorEmail,
        subject: 'Appointment Update - SafeIn',
        html: getAppointmentRejectionEmailTemplate(visitorName, employeeName, scheduledDate, scheduledTime),
        text: getAppointmentRejectionEmailText(visitorName, employeeName, scheduledDate, scheduledTime),
        fromName: process.env.SMTP_FROM_NAME || 'SafeIn',
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
    scheduledTime: string
  ): Promise<void> {
    try {
      await this.sendEmail({
        to: employeeEmail,
        subject: 'Appointment Approved - SafeIn',
        html: getEmployeeAppointmentApprovalEmailTemplate(employeeName, visitorName, scheduledDate, scheduledTime),
        text: getEmployeeAppointmentApprovalEmailText(employeeName, visitorName, scheduledDate, scheduledTime),
        fromName: process.env.SMTP_FROM_NAME || 'SafeIn',
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
    scheduledTime: string
  ): Promise<void> {
    try {
      await this.sendEmail({
        to: employeeEmail,
        subject: 'Appointment Rejected - SafeIn',
        html: getEmployeeAppointmentRejectionEmailTemplate(employeeName, visitorName, scheduledDate, scheduledTime),
        text: getEmployeeAppointmentRejectionEmailText(employeeName, visitorName, scheduledDate, scheduledTime),
        fromName: process.env.SMTP_FROM_NAME || 'SafeIn',
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
    approvalToken: string
  ): Promise<void> {
    try {
      await this.sendEmail({
        to: employeeEmail,
        subject: 'New Appointment Request - SafeIn',
        html: getNewAppointmentRequestEmailTemplate(employeeName, visitorDetails, scheduledDate, scheduledTime, purpose, approvalToken),
        text: getNewAppointmentRequestEmailText(employeeName, visitorDetails, scheduledDate, scheduledTime, purpose, approvalToken),
        fromName: process.env.SMTP_FROM_NAME || 'SafeIn',
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
      
      if (process.env.NODE_ENV === 'development') {
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
    expiresAt: Date
  ): Promise<void> {
    try {
      await this.sendEmail({
        to: visitorEmail,
        subject: 'Book Your Appointment - SafeIn',
        html: getAppointmentLinkEmailTemplate(employeeName, bookingUrl, expiresAt),
        text: getAppointmentLinkEmailText(employeeName, bookingUrl, expiresAt),
        fromName: process.env.SMTP_FROM_NAME || 'SafeIn',
        logMessage: 'Appointment link email',
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
    purpose: string
  ): Promise<void> {
    try {
      await this.sendEmail({
        to: visitorEmail,
        subject: 'Appointment Request Submitted - SafeIn',
        html: getAppointmentConfirmationEmailTemplate(visitorName, employeeName, scheduledDate, scheduledTime, purpose),
        text: getAppointmentConfirmationEmailText(visitorName, employeeName, scheduledDate, scheduledTime, purpose),
        fromName: process.env.SMTP_FROM_NAME || 'SafeIn',
        logMessage: 'Appointment confirmation email to visitor',
      });
    } catch (error: any) {
      console.error('Failed to send appointment confirmation email to visitor:', error.message);
      if (process.env.NODE_ENV === 'development') {
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
}
