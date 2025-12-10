/**
 * Login Page Content
 * Luxury split-screen login
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { Building2 } from 'lucide-react';
import { LoginForm } from './login-form';
import {
  LoginLayout,
  AuthFormCard,
  AuthFormHeader,
  AuthFooterLinks,
} from '@/components/business/auth';

export function LoginPageContent() {
  return (
    <LoginLayout>
      <AuthFormCard>
        {/* Header */}
        <AuthFormHeader
          icon={<Building2 className="h-8 w-8" />}
          title="Sign In"
          description="Welcome back to your business portal"
        />

        {/* Login Form */}
        <LoginForm />

        {/* Footer */}
        <div className="mt-8 text-center">
          <AuthFooterLinks variant="login" />
        </div>
      </AuthFormCard>
    </LoginLayout>
  );
}
