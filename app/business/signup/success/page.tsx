/**
 * Business Signup Success Page
 * Shows pending approval message after successful registration
 */

import { Metadata } from 'next';
import { SuccessPageContent } from './components/success-page-content';
import '@/app/business/globals.css';

export const metadata: Metadata = {
  title: 'Registration Successful | Business Portal',
  description: 'Your business account is pending approval',
};

export default function BusinessSignupSuccessPage() {
  return <SuccessPageContent />;
}
