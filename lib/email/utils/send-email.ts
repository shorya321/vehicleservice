'use server';

import { jsx } from 'react/jsx-runtime';
import { getResendClient, getEmailConfig } from '../config';
import type { EmailResult } from '../types';
import type React from 'react';

interface SendEmailParams {
  to: string;
  subject: string;
  template: React.ComponentType<any>;
  templateProps: Record<string, any>;
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
}: SendEmailParams): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to,
      replyTo: emailConfig.replyTo,
      subject,
      react: jsx(template, templateProps),
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
