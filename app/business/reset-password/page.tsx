/**
 * Business Reset Password Page
 * Server component with metadata
 *
 * SCOPE: Business module ONLY
 */

import { Metadata } from 'next';
import { ResetPasswordContent } from './components/reset-password-content';
import '@/app/business/globals.css';

export const metadata: Metadata = {
  title: 'Reset Password | Business Portal',
  description: 'Create a new password for your business account',
};

export default function BusinessResetPasswordPage() {
  return <ResetPasswordContent />;
}
