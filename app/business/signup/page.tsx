/**
 * Business Account Signup Page
 * Public page for new business registration
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

import { SignupForm } from './components/signup-form';

export const metadata: Metadata = {
  title: 'Business Signup | Vehicle Transfer Service',
  description: 'Create a business account to manage transfer bookings for your customers',
};

export default function BusinessSignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Create Business Account</h1>
          <p className="text-muted-foreground">
            Start booking transfers for your customers with prepaid credits
          </p>
        </div>

        {/* Signup Form Card */}
        <div className="bg-card border rounded-lg p-8 shadow-sm">
          <SignupForm />

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/business/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-4">
            <div className="font-medium mb-1">Prepaid Wallet</div>
            <p className="text-muted-foreground">Add credits and book transfers easily</p>
          </div>
          <div className="text-center p-4">
            <div className="font-medium mb-1">Custom Domain</div>
            <p className="text-muted-foreground">Use your own branded domain</p>
          </div>
          <div className="text-center p-4">
            <div className="font-medium mb-1">Dedicated Portal</div>
            <p className="text-muted-foreground">Manage all bookings in one place</p>
          </div>
        </div>
      </div>
    </div>
  );
}
