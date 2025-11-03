/**
 * Business Account Login Page
 * Public page for business authentication
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

import { LoginForm } from './components/login-form';

export const metadata: Metadata = {
  title: 'Business Login | Vehicle Transfer Service',
  description: 'Sign in to your business account',
};

export default function BusinessLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Business Portal</h1>
          <p className="text-muted-foreground">Sign in to manage your bookings</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-card border rounded-lg p-8 shadow-sm">
          <LoginForm />

          {/* Signup Link */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/business/signup" className="text-primary hover:underline font-medium">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
