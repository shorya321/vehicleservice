/**
 * Authentication mail: always platform credentials, including for business portal users.
 *
 * A reset link is a bearer credential. Sent through a tenant's own SMTP server, whoever
 * administers that server could read every staff member's reset link and take over their
 * account entirely outside the product's permission model. It would also mean an owner
 * whose mail server is broken cannot recover their account, at exactly the moment they
 * need to. Account recovery runs on infrastructure the platform controls.
 */

import { sendEmail } from '../utils/send-email';
import {
  type EmailResult,
  type WelcomeEmailData,
  type VerificationEmailData,
  type PasswordResetEmailData,
} from '../types';
import WelcomeEmail from '../templates/auth/welcome';
import VerificationEmail from '../templates/auth/verification';
import PasswordResetEmail from '../templates/auth/password-reset';

/**
 * Send welcome email with verification link
 */
export async function sendWelcomeEmail(
  data: WelcomeEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.email,
    subject: 'Welcome to Infinia Transfers! Please confirm your email',
    template: WelcomeEmail,
    templateProps: {
      name: data.name,
      verificationUrl: data.verificationUrl,
    },
  });
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(
  data: VerificationEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.email,
    subject: 'Verify Your Email Address',
    template: VerificationEmail,
    templateProps: {
      name: data.name,
      verificationUrl: data.verificationUrl,
    },
  });
}

/**
 * Send password reset email with reset link
 */
export async function sendPasswordResetEmail(
  data: PasswordResetEmailData
): Promise<EmailResult> {
  return sendEmail({
    businessAccountId: null,
    to: data.email,
    subject: 'Reset Your Password - Infinia Transfers',
    template: PasswordResetEmail,
    templateProps: {
      name: data.name,
      resetUrl: data.resetUrl,
    },
  });
}