'use server';

import { jsx } from 'react/jsx-runtime';
import { getResendClient, getEmailConfig } from '@/lib/email/config';
import {
  type EmailTemplateType,
  getTemplatePreviewData,
  getTemplateById,
} from '@/lib/email/utils/preview-data';

// Import email templates
import WelcomeEmail from '@/lib/email/templates/auth/welcome';
import VerificationEmail from '@/lib/email/templates/auth/verification';
import PasswordResetEmail from '@/lib/email/templates/auth/password-reset';
import BookingConfirmationEmail from '@/lib/email/templates/booking/confirmation';
import BookingStatusUpdateEmail from '@/lib/email/templates/booking/status-update';
import VendorApplicationReceivedEmail from '@/lib/email/templates/vendor/application-received';
import VendorApplicationApprovedEmail from '@/lib/email/templates/vendor/application-approved';
import VendorApplicationRejectedEmail from '@/lib/email/templates/vendor/application-rejected';
import BookingAssignedEmail from '@/lib/email/templates/vendor/booking-assigned';
import BookingDriverAssignedEmail from '@/lib/email/templates/booking/driver-assigned';
import BusinessCustomerDriverAssignedEmail from '@/lib/email/templates/business/customer-driver-assigned';
import BusinessBookingDriverAssignedEmail from '@/lib/email/templates/business/booking-driver-assigned';
import DirectBookingCustomerConfirmationEmail from '@/lib/email/templates/direct-booking/customer-confirmation';
import DirectBookingCustomerStatusUpdateEmail from '@/lib/email/templates/direct-booking/customer-status-update';
import DirectBookingCustomerCancelledEmail from '@/lib/email/templates/direct-booking/customer-cancelled';
import DirectBookingDriverAssignmentEmail from '@/lib/email/templates/direct-booking/driver-assignment';

const templateComponents = {
  welcome: WelcomeEmail,
  verification: VerificationEmail,
  passwordReset: PasswordResetEmail,
  bookingConfirmation: BookingConfirmationEmail,
  bookingStatus: BookingStatusUpdateEmail,
  vendorReceived: VendorApplicationReceivedEmail,
  vendorApproved: VendorApplicationApprovedEmail,
  vendorRejected: VendorApplicationRejectedEmail,
  vendorBookingAssigned: BookingAssignedEmail,
  driverAssigned: BookingDriverAssignedEmail,
  businessCustomerDriverAssigned: BusinessCustomerDriverAssignedEmail,
  businessDriverAssigned: BusinessBookingDriverAssignedEmail,
  directBookingCustomerConfirmation: DirectBookingCustomerConfirmationEmail,
  directBookingCustomerStatusUpdate: DirectBookingCustomerStatusUpdateEmail,
  directBookingCustomerCancelled: DirectBookingCustomerCancelledEmail,
  directBookingDriverAssignment: DirectBookingDriverAssignmentEmail,
};

interface SendTestEmailParams {
  templateId: EmailTemplateType;
  recipientEmail: string;
}

export async function sendTestEmail({
  templateId,
  recipientEmail,
}: SendTestEmailParams) {
  try {
    const template = getTemplateById(templateId);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const TemplateComponent = templateComponents[templateId];
    const previewData = getTemplatePreviewData(templateId);

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: recipientEmail,
      replyTo: emailConfig.replyTo,
      subject: template.subject,
      react: jsx(TemplateComponent, previewData),
    });

    if (error) {
      console.error('Failed to send test email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send test email',
      };
    }

    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending test email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}
