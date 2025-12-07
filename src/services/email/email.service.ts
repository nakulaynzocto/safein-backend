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

export class EmailService {
  private static transporter: nodemailer.Transporter;
  private static isEmailServiceAvailable: boolean = false;
  private static useHttpFallback: boolean = false; // e.g., Resend HTTP API

  /**
   * Initialize email transporter
   */
  static initializeTransporter(): nodemailer.Transporter {
    if (this.transporter && this.isEmailServiceAvailable) {
      return this.transporter;
    }

    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      tls: { rejectUnauthorized: false },
      pool: true,
      // Increased timeouts for production environments like Render
      connectionTimeout: 15000, // 15 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 20000 // 20 seconds
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
      
      // Skip verification if explicitly set (useful for production)
      if (process.env.SKIP_SMTP_VERIFY === 'true') {
        console.log('SMTP verification skipped (SKIP_SMTP_VERIFY=true)');
        this.isEmailServiceAvailable = true;
        return true;
      }
      
      // Try to verify connection with timeout (increased for Render)
      const verifyPromise = this.transporter.verify();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SMTP verification timeout')), 10000) // 10 seconds
      );
      
      await Promise.race([verifyPromise, timeoutPromise]);
      this.isEmailServiceAvailable = true;
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error: any) {
      console.error('SMTP connection verification failed:', error.message);
      console.error('SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? '***' : 'not set',
        fromEmail: process.env.SMTP_FROM_EMAIL,
        skipVerify: process.env.SKIP_SMTP_VERIFY
      });
      
      this.isEmailServiceAvailable = false;
      
      // Enable Resend fallback if available
      if (process.env.RESEND_API_KEY) {
        this.useHttpFallback = true;
        console.log('Resend API fallback enabled');
      }
      
      // Try alternative SMTP configs for Gmail
      if (error.code === 'EAUTH' && process.env.SMTP_HOST === 'smtp.gmail.com') {
        console.log('Trying alternative SMTP configurations...');
        const alternativeWorked = await this.tryAlternativeSmtpConfigs();
        if (alternativeWorked) {
          return true;
        }
      }
      
      // In production with SKIP_SMTP_VERIFY not set, log warning but don't fail
      if (process.env.NODE_ENV === 'production') {
        console.warn('SMTP verification failed in production. Emails will be attempted anyway.');
        console.warn('To skip verification, set SKIP_SMTP_VERIFY=true in environment variables');
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
      // Initialize transporter if not already done
      if (!this.transporter) {
        this.initializeTransporter();
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'SafeIn Security Management'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
        to: email,
        subject: 'SafeIn Registration - Verify Your Email',
        html: getOtpEmailTemplate(otp, companyName),
        text: getOtpEmailText(otp, companyName)
      };

      // If SKIP_SMTP_VERIFY is true, skip verification and try sending directly
      // This is the recommended approach for Render/production where verification times out
      if (process.env.SKIP_SMTP_VERIFY === 'true') {
        console.log('SKIP_SMTP_VERIFY=true: Attempting to send email without verification...');
        try {
          await this.transporter.sendMail(mailOptions);
          this.isEmailServiceAvailable = true; // Mark as available if send succeeds
          console.log('✓ OTP email sent via SMTP (verification skipped)');
          return;
        } catch (sendError: any) {
          // If send fails, try Resend fallback if available
          if (process.env.RESEND_API_KEY) {
            console.log('SMTP send failed, trying Resend API fallback...');
            try {
              await this.sendWithResend({
                to: email,
                subject: 'SafeIn Registration - Verify Your Email',
                html: getOtpEmailTemplate(otp, companyName),
                text: getOtpEmailText(otp, companyName),
              });
              console.log('✓ OTP email sent via Resend API (fallback)');
              return;
            } catch (resendError: any) {
              console.error('Resend fallback also failed:', resendError.message);
              throw sendError; // Throw original SMTP error
            }
          }
          throw sendError;
        }
      }

      // Try Resend fallback first if available and SMTP is not available
      if (!this.isEmailServiceAvailable && this.useHttpFallback && process.env.RESEND_API_KEY) {
        try {
          await this.sendWithResend({
            to: email,
            subject: 'SafeIn Registration - Verify Your Email',
            html: getOtpEmailTemplate(otp, companyName),
            text: getOtpEmailText(otp, companyName),
          });
          console.log('✓ OTP email sent via Resend API');
          return;
        } catch (resendError: any) {
          console.error('Resend fallback failed:', resendError.message);
        }
      }

      // If email service is already verified, send directly
      if (this.isEmailServiceAvailable) {
        try {
          await this.transporter.sendMail(mailOptions);
          console.log('✓ OTP email sent via SMTP (verified connection)');
          return;
        } catch (sendError: any) {
          // If verified connection fails, try Resend if available
          if (process.env.RESEND_API_KEY && (sendError.code === 'ETIMEDOUT' || sendError.code === 'ECONNECTION')) {
            console.log('SMTP connection timeout, trying Resend API fallback...');
            try {
              await this.sendWithResend({
                to: email,
                subject: 'SafeIn Registration - Verify Your Email',
                html: getOtpEmailTemplate(otp, companyName),
                text: getOtpEmailText(otp, companyName),
              });
              console.log('✓ OTP email sent via Resend API (timeout fallback)');
              return;
            } catch (resendError: any) {
              console.error('Resend fallback failed:', resendError.message);
            }
          }
          throw sendError;
        }
      }

      // Try to verify connection first (with timeout handling)
      try {
        const isConnected = await this.verifyConnection();
        if (isConnected) {
          await this.transporter.sendMail(mailOptions);
          console.log('✓ OTP email sent via SMTP (after verification)');
          return;
        }
      } catch (verifyError: any) {
        // If verification fails due to timeout, try sending anyway
        if (verifyError.message?.includes('timeout') || verifyError.code === 'ETIMEDOUT') {
          console.log('SMTP verification timed out, attempting to send email anyway...');
          try {
            await this.transporter.sendMail(mailOptions);
            this.isEmailServiceAvailable = true;
            console.log('✓ OTP email sent via SMTP (after timeout)');
            return;
          } catch (sendError: any) {
            // Try Resend if available
            if (process.env.RESEND_API_KEY) {
              console.log('SMTP send failed after timeout, trying Resend API...');
              try {
                await this.sendWithResend({
                  to: email,
                  subject: 'SafeIn Registration - Verify Your Email',
                  html: getOtpEmailTemplate(otp, companyName),
                  text: getOtpEmailText(otp, companyName),
                });
                console.log('✓ OTP email sent via Resend API (timeout fallback)');
                return;
              } catch (resendError: any) {
                console.error('Resend fallback failed:', resendError.message);
              }
            }
            throw sendError;
          }
        }
        throw verifyError;
      }

      // In production, throw error if we can't send
      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Failed to send OTP email. Please check email service configuration.', ERROR_CODES.INTERNAL_SERVER_ERROR);
      }

      // In development, just log and return
      console.warn('Email service not available, skipping email send in development');
    } catch (error: any) {
      console.error('Failed to send OTP email:', error.message);
      console.error('Error details:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        errno: error.errno,
        syscall: error.syscall
      });
      
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
      if (!this.transporter) {
        this.initializeTransporter();
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'SafeIn Security Management'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
        to: email,
        subject: 'Welcome to SafeIn - Your Account is Ready!',
        html: getWelcomeEmailTemplate(companyName),
        text: getWelcomeEmailText(companyName)
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
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
    if (!this.isEmailServiceAvailable) {
      return;
    }

    if (!this.transporter) {
      this.initializeTransporter();
    }
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
      to: visitorEmail,
      subject: 'Appointment Approved - SafeIn',
      html: getAppointmentApprovalEmailTemplate(visitorName, employeeName, scheduledDate, scheduledTime),
      text: getAppointmentApprovalEmailText(visitorName, employeeName, scheduledDate, scheduledTime)
    };

    try {
      await this.transporter.sendMail(mailOptions);
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
    if (!this.isEmailServiceAvailable) {
      return;
    }

    if (!this.transporter) {
      this.initializeTransporter();
    }
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
      to: visitorEmail,
      subject: 'Appointment Update - SafeIn',
      html: getAppointmentRejectionEmailTemplate(visitorName, employeeName, scheduledDate, scheduledTime),
      text: getAppointmentRejectionEmailText(visitorName, employeeName, scheduledDate, scheduledTime)
    };

    try {
      await this.transporter.sendMail(mailOptions);
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
    const transporter = this.initializeTransporter();
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
      to: employeeEmail,
      subject: 'Appointment Approved - SafeIn',
      html: getEmployeeAppointmentApprovalEmailTemplate(employeeName, visitorName, scheduledDate, scheduledTime),
      text: getEmployeeAppointmentApprovalEmailText(employeeName, visitorName, scheduledDate, scheduledTime)
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send appointment approval email to employee:', error);
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
    const transporter = this.initializeTransporter();
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
      to: employeeEmail,
      subject: 'Appointment Rejected - SafeIn',
      html: getEmployeeAppointmentRejectionEmailTemplate(employeeName, visitorName, scheduledDate, scheduledTime),
      text: getEmployeeAppointmentRejectionEmailText(employeeName, visitorName, scheduledDate, scheduledTime)
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send appointment rejection email to employee:', error);
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
    appointmentId: string
  ): Promise<void> {
    if (!this.isEmailServiceAvailable) {
      return;
    }

    if (!this.transporter) {
      this.initializeTransporter();
    }
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'SafeIn'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
      to: employeeEmail,
      subject: 'New Appointment Request - SafeIn',
      html: getNewAppointmentRequestEmailTemplate(employeeName, visitorDetails, scheduledDate, scheduledTime, purpose, appointmentId),
      text: getNewAppointmentRequestEmailText(employeeName, visitorDetails, scheduledDate, scheduledTime, purpose, appointmentId)
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error: any) {
      console.error('Failed to send new appointment request email:', error.message);
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, resetUrl: string, companyName: string): Promise<void> {
    try {
      if (!this.isEmailServiceAvailable && this.useHttpFallback) {
        try {
          await this.sendWithResend({
            to: email,
            subject: 'Reset Your Password - SafeIn',
            html: getPasswordResetEmailTemplate(resetUrl, companyName),
            text: getPasswordResetEmailText(resetUrl, companyName),
          });
          return;
        } catch (resendError: any) {
          console.error('Resend fallback failed:', resendError.message);
        }
      }

      if (!this.transporter) {
        this.initializeTransporter();
      }

      if (this.isEmailServiceAvailable) {
        const mailOptions = {
          from: `"${process.env.SMTP_FROM_NAME || 'SafeIn Security Management'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
          to: email,
          subject: 'Reset Your Password - SafeIn',
          html: getPasswordResetEmailTemplate(resetUrl, companyName),
          text: getPasswordResetEmailText(resetUrl, companyName)
        };

        await this.transporter.sendMail(mailOptions);
        return;
      }

      const isConnected = await this.verifyConnection();
      if (isConnected) {
        const mailOptions = {
          from: `"${process.env.SMTP_FROM_NAME || 'SafeIn Security Management'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
          to: email,
          subject: 'Reset Your Password - SafeIn',
          html: getPasswordResetEmailTemplate(resetUrl, companyName),
          text: getPasswordResetEmailText(resetUrl, companyName)
        };

        await this.transporter.sendMail(mailOptions);
        return;
      }

      if (process.env.NODE_ENV === 'production') {
        throw new AppError('Failed to send password reset email. Please check email service configuration.', ERROR_CODES.INTERNAL_SERVER_ERROR);
      }
    } catch (error: any) {
      console.error('Failed to send password reset email:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        return;
      }
      
      throw new AppError('Failed to send password reset email', ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Send password reset confirmation email
   */
  static async sendPasswordResetConfirmationEmail(email: string, companyName: string): Promise<void> {
    try {
      if (!this.transporter) {
        this.initializeTransporter();
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'SafeIn Security Management'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@safein.app'}>`,
        to: email,
        subject: 'Password Reset Successful - SafeIn',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1A73E8;">Password Reset Successful</h2>
            <p>Hello ${companyName},</p>
            <p>Your password has been successfully reset.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <p>Best regards,<br/>SafeIn Security Team</p>
          </div>
        `,
        text: `Password Reset Successful\n\nHello ${companyName},\n\nYour password has been successfully reset.\n\nIf you did not make this change, please contact our support team immediately.\n\nBest regards,\nSafeIn Security Team`
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error: any) {
      console.error('Failed to send password reset confirmation email:', error.message);
    }
  }
}
