/**
 * Business Forgot Password Page
 * Server component with metadata
 *
 * SCOPE: Business module ONLY
 */

import { Metadata } from 'next';
import { ForgotPasswordContent } from './components/forgot-password-content';
import '@/app/business/globals.css';

export const metadata: Metadata = {
  title: 'Forgot Password | Business Portal',
  description: 'Reset your business account password',
};

export default function BusinessForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
