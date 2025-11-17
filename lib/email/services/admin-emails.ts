'use server';

import { sendEmail } from '../utils/send-email';
import {
  type EmailResult,
  type NewUserRegistrationNotificationEmailData,
} from '../types';
import NewUserNotificationEmail from '../templates/admin/new-user-notification';

/**
 * Send admin notification for new user registration
 */
export async function sendNewUserNotificationEmail(
  data: NewUserRegistrationNotificationEmailData
): Promise<EmailResult> {
  return sendEmail({
    to: data.adminEmail,
    subject: `New User Registration - ${data.userName}`,
    template: NewUserNotificationEmail,
    templateProps: {
      userName: data.userName,
      userEmail: data.userEmail,
      userPhone: data.userPhone,
      registrationDate: data.registrationDate,
      userDetailsUrl: data.userDetailsUrl,
    },
  });
}
