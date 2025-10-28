/**
 * Email Templates
 * Exports all email templates for easy importing
 */

export { getBaseEmailTemplate } from './base-email.template';
export { getOtpEmailTemplate, getOtpEmailText } from './otp-email.template';
export { getWelcomeEmailTemplate, getWelcomeEmailText } from './welcome-email.template';
export { getAppointmentApprovalEmailTemplate, getAppointmentApprovalEmailText } from './appointment-approval-email.template';
export { getAppointmentRejectionEmailTemplate, getAppointmentRejectionEmailText } from './appointment-rejection-email.template';
export { 
  getEmployeeAppointmentApprovalEmailTemplate, 
  getEmployeeAppointmentApprovalEmailText,
  getEmployeeAppointmentRejectionEmailTemplate,
  getEmployeeAppointmentRejectionEmailText
} from './employee-appointment-email.template';
export { getNewAppointmentRequestEmailTemplate, getNewAppointmentRequestEmailText } from './new-appointment-request-email.template';

