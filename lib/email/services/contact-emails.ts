'use server';

import { sendEmail } from '../utils/send-email';
import type { EmailResult } from '../types';
import ContactConfirmationEmail from '../templates/contact/submission-confirmation';
import ContactAdminNotificationEmail from '../templates/contact/admin-notification';
import ContactReplyEmail from '../templates/contact/reply-notification';

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  booking: 'Booking Assistance',
  corporate: 'Corporate Services',
  fleet: 'Fleet Partnership',
  feedback: 'Feedback',
  other: 'Other',
};

function getSubjectLabel(key: string): string {
  return SUBJECT_LABELS[key] || key;
}

export async function sendContactConfirmationEmail(data: {
  email: string;
  name: string;
  subject: string;
  message: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: data.email,
    subject: 'Thank you for contacting Infinia Transfers',
    template: ContactConfirmationEmail,
    templateProps: {
      name: data.name,
      subject: getSubjectLabel(data.subject),
      message: data.message,
    },
  });
}

export async function sendContactAdminNotificationEmail(data: {
  adminEmail: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  submissionId: string;
}): Promise<EmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  return sendEmail({
    to: data.adminEmail,
    subject: `New Contact Submission - ${data.name}`,
    template: ContactAdminNotificationEmail,
    templateProps: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      subject: getSubjectLabel(data.subject),
      message: data.message,
      submissionUrl: `${appUrl}/admin/contact/${data.submissionId}`,
    },
  });
}

export async function sendContactReplyEmail(data: {
  email: string;
  name: string;
  replyMessage: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: data.email,
    subject: 'Reply from Infinia Transfers',
    template: ContactReplyEmail,
    templateProps: {
      name: data.name,
      replyMessage: data.replyMessage,
    },
  });
}
