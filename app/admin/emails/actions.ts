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

const templateComponents = {
  welcome: WelcomeEmail,
  verification: VerificationEmail,
  passwordReset: PasswordResetEmail,
  bookingConfirmation: BookingConfirmationEmail,
  bookingStatus: BookingStatusUpdateEmail,
  vendorReceived: VendorApplicationReceivedEmail,
  vendorApproved: VendorApplicationApprovedEmail,
  vendorRejected: VendorApplicationRejectedEmail,
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
