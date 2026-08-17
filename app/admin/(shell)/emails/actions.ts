'use server';

import { sendEmail } from '@/lib/email/utils/send-email';
import {
  type EmailTemplateType,
  getTemplatePreviewData,
  getTemplateById,
} from '@/lib/email/utils/preview-data';
// Shared with the preview client, so the body sent as a test is the body shown on screen.
import { templateComponents } from '@/lib/email/utils/template-components';

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
