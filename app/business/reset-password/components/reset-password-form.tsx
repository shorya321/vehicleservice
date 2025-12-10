/**
 * Reset Password Form Component
 * Handles new password input with validation and strength indicator
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

import { LuxuryLabel } from '@/components/business/ui/luxury-input';
import {
  PasswordInput,
  PasswordStrengthBar,
  PasswordRequirements,
  AnimatedAlert,
  AuthFormContainer,
  AuthFormField,
} from '@/components/business/auth';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    // Check if we have a valid token from the reset link
    if (!token) {
      router.push('/business/forgot-password');
    }
  }, [token, router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/business/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to update password');
      } else {
        router.push('/business/login?message=Password updated successfully');
      }
    } catch (err) {
      console.error('Password update error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdatePassword} className="space-y-6">
      <AuthFormContainer className="space-y-5">
        {/* Error Message */}
        <AnimatedAlert
          variant="error"
          message={error || ''}
          isVisible={!!error}
          onDismiss={() => setError(null)}
        />

        {/* New Password Input */}
        <AuthFormField>
          <div className="space-y-2">
            <LuxuryLabel htmlFor="password" className="text-[var(--luxury-pearl)]">
              New Password
            </LuxuryLabel>
            <PasswordInput
              id="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              showLockIcon
              className="auth-input"
            />
          </div>
        </AuthFormField>

        {/* Confirm Password Input */}
        <AuthFormField>
          <div className="space-y-2">
            <LuxuryLabel htmlFor="confirmPassword" className="text-[var(--luxury-pearl)]">
              Confirm Password
            </LuxuryLabel>
            <PasswordInput
              id="confirmPassword"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              showLockIcon
              className="auth-input"
            />
          </div>
        </AuthFormField>

        {/* Password Strength Indicator */}
        <AuthFormField>
          <PasswordStrengthBar password={password} />
        </AuthFormField>

        {/* Password Requirements Checklist */}
        <AuthFormField>
          <PasswordRequirements
            password={password}
            confirmPassword={confirmPassword}
            showMatchRequirement
          />
        </AuthFormField>

        {/* Submit Button */}
        <AuthFormField>
          <button
            type="submit"
            disabled={loading}
            className="auth-btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating password...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </AuthFormField>

        {/* Back to Login Link */}
        <AuthFormField>
          <div className="text-center pt-2">
            <Link
              href="/business/login"
              className="inline-flex items-center text-sm text-[var(--luxury-light-gray)] hover:text-[var(--luxury-gold)] transition-colors"
            >
              Back to login
            </Link>
          </div>
        </AuthFormField>
      </AuthFormContainer>
    </form>
  );
}
