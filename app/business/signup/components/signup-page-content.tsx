/**
 * Signup Page Content
 * Luxury split-screen signup with feature highlights
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { UserPlus } from 'lucide-react';
import { SignupForm } from './signup-form';
import {
  SignupLayout,
  AuthFormCard,
  AuthFormHeader,
  AuthFooterLinks,
} from '@/components/business/auth';

export function SignupPageContent() {
  return (
    <SignupLayout>
      <AuthFormCard className="p-6 md:p-8">
        {/* Header */}
        <AuthFormHeader
          icon={<UserPlus className="h-8 w-8" />}
          title="Create Account"
          description="Start booking premium transfers for your business"
        />

        {/* Signup Form */}
        <SignupForm />

        {/* Footer */}
        <div className="mt-8 text-center">
          <AuthFooterLinks variant="signup" />
        </div>
      </AuthFormCard>
    </SignupLayout>
  );
}
