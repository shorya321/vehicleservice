'use server';

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
    to: data.email,
    subject: 'Welcome to Vehicle Service - Verify Your Email',
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
    to: data.email,
    subject: 'Reset Your Password - Vehicle Service',
    template: PasswordResetEmail,
    templateProps: {
      name: data.name,
      resetUrl: data.resetUrl,
    },
  });
}
