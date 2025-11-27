'use client';

/**
 * Login Page Content with Animations
 * Client component that wraps login page with entrance animations
 */

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { LoginForm } from './login-form';
import {
  AuthPageWrapper,
  AnimatedIconBadge,
  AnimatedHeader,
  AnimatedCard,
  AnimatedFooter,
} from '@/components/business/auth/auth-page-wrapper';

export function LoginPageContent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 business-mesh-bg">
      <AuthPageWrapper className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <AnimatedIconBadge className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-[rgba(99,102,241,0.15)]">
              <Building2 className="h-8 w-8 text-[var(--business-primary-400)]" />
            </div>
          </AnimatedIconBadge>
          <AnimatedHeader>
            <h1 className="business-text-headline mb-2">Business Portal</h1>
            <p className="business-text-body text-[var(--business-text-secondary)]">
              Sign in to manage your bookings
            </p>
          </AnimatedHeader>
        </div>

        {/* Login Form Card */}
        <AnimatedCard className="business-glass-elevated rounded-2xl p-8">
          <LoginForm />

          {/* Signup Link */}
          <AnimatedFooter className="mt-6 text-center text-sm text-[var(--business-text-muted)]">
            Don't have an account?{' '}
            <Link
              href="/business/signup"
              className="text-[var(--business-primary-400)] hover:underline font-medium"
            >
              Create one
            </Link>
          </AnimatedFooter>
        </AnimatedCard>
      </AuthPageWrapper>
    </div>
  );
}
