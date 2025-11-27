/**
 * Business Account Login Page
 * Public page for business authentication
 */

import { Metadata } from 'next';
import { LoginPageContent } from './components/login-page-content';
import '@/app/business/globals.css';

export const metadata: Metadata = {
  title: 'Business Login | Vehicle Transfer Service',
  description: 'Sign in to your business account',
};

export default function BusinessLoginPage() {
  return <LoginPageContent />;
}
