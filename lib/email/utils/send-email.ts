'use server';

import { jsx } from 'react/jsx-runtime';
import { render } from '@react-email/render';
import { getResendClient, getEmailConfig } from '../config';
import type { EmailResult } from '../types';
import type React from 'react';

interface SendEmailParams {
  to: string;
  subject: string;
  template: React.ComponentType<any>;
  templateProps: Record<string, any>;
  /**
   * Overrides the global reply-to for mail sent on someone else's behalf —
   * a vendor's own address on a direct-booking notification, for example.
   * Omit to keep the platform default.
   */
  replyTo?: string;
}

/**
 * Reusable email sender utility
 * Eliminates code duplication across all email services
 */
export async function sendEmail({
  to,
  subject,
  template,
  templateProps,
  replyTo,
}: SendEmailParams): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const reactElement = jsx(template, templateProps);
    const plainText = await render(reactElement, { plainText: true });

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to,
      replyTo: replyTo || emailConfig.replyTo,
      subject,
      react: reactElement,
      text: plainText,
    });

    if (error) {
      console.error(`Failed to send email to ${to}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error(`Unexpected error sending email to ${to}:`, error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}
