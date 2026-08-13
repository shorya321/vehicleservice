'use server';

import { sendEmail } from '@/lib/email/utils/send-email';
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
import BusinessCustomerDriverAssignedEmail from '@/lib/business/email/templates/customer-driver-assigned';
import BusinessBookingDriverAssignedEmail from '@/lib/business/email/templates/booking-driver-assigned';
import DirectBookingCustomerConfirmationEmail from '@/lib/email/templates/direct-booking/customer-confirmation';
import DirectBookingCustomerStatusUpdateEmail from '@/lib/email/templates/direct-booking/customer-status-update';
import DirectBookingCustomerCancelledEmail from '@/lib/email/templates/direct-booking/customer-cancelled';
import DirectBookingDriverAssignmentEmail from '@/lib/email/templates/direct-booking/driver-assignment';
import AdminNewBookingNotificationEmail from '@/lib/email/templates/admin/new-booking-notification';
import AdminNewVendorApplicationNotificationEmail from '@/lib/email/templates/admin/new-vendor-application-notification';

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
  adminNewBooking: AdminNewBookingNotificationEmail,
  adminNewVendorApplication: AdminNewVendorApplicationNotificationEmail,
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

    const TemplateComponent = templateComponents[templateId];
    const previewData = getTemplatePreviewData(templateId);

    // Platform credentials: this is an admin previewing the platform's own templates,
    // not a tenant sending to its customers.
    const result = await sendEmail({
      businessAccountId: null,
      to: recipientEmail,
      subject: template.subject,
      template: TemplateComponent,
      templateProps: previewData as Record<string, unknown>,
    });

    if (!result.success) {
      console.error('Failed to send test email:', result.error);
      return { success: false, error: result.error || 'Failed to send test email' };
    }

    return { success: true, emailId: result.emailId };
  } catch (error) {
    console.error('Unexpected error sending test email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}
