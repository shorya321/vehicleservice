/**
 * Reset Password Page Content
 * Split-screen layout with branding and form
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { Suspense } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ResetPasswordForm } from './reset-password-form';
import {
  ResetPasswordLayout,
  AuthFormCard,
  AuthFormHeader,
} from '@/components/business/auth';

// Suspense wrapper for searchParams
function ResetPasswordFormWrapper() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-[var(--luxury-gray)]/20 rounded-lg" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

export function ResetPasswordContent() {
  return (
    <ResetPasswordLayout>
      <AuthFormCard>
        {/* Header */}
        <AuthFormHeader
          icon={<ShieldCheck className="h-8 w-8" />}
          title="Reset Password"
          description="Create a strong password to secure your account"
        />

        {/* Form */}
        <ResetPasswordFormWrapper />
      </AuthFormCard>
    </ResetPasswordLayout>
  );
}
