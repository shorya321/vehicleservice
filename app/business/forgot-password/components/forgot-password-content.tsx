/**
 * Forgot Password Page Content
 * Split-screen layout with branding and form
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { KeyRound } from 'lucide-react';
import { ForgotPasswordForm } from './forgot-password-form';
import {
  ForgotPasswordLayout,
  AuthFormCard,
  AuthFormHeader,
} from '@/components/business/auth';

export function ForgotPasswordContent() {
  return (
    <ForgotPasswordLayout>
      <AuthFormCard>
        {/* Header */}
        <AuthFormHeader
          icon={<KeyRound className="h-8 w-8" />}
          title="Forgot Password"
          description="Enter your email and we'll send you a reset link"
        />

        {/* Form */}
        <ForgotPasswordForm />
      </AuthFormCard>
    </ForgotPasswordLayout>
  );
}
