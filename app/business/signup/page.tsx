/**
 * Business Account Signup Page
 * Public page for new business registration
 */

import { Metadata } from 'next';
import { SignupPageContent } from './components/signup-page-content';
import '@/app/business/globals.css';

export const metadata: Metadata = {
  title: 'Business Signup | Vehicle Transfer Service',
  description: 'Create a business account to manage transfer bookings for your customers',
};

export default function BusinessSignupPage() {
  return <SignupPageContent />;
}
