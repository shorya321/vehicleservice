/**
 * Forgot Password Form Component
 * Handles password reset request with email input and resend logic
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Mail, HelpCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { LuxuryInput, LuxuryLabel } from '@/components/business/ui/luxury-input';
import {
  AnimatedAlert,
  AuthFormContainer,
  AuthFormField,
} from '@/components/business/auth';
import { useReducedMotion } from '@/lib/business/animation/hooks';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (message) {
      setCanResend(true);
    }
  }, [resendTimer, message]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    setCanResend(false);

    try {
      const response = await fetch('/api/business/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to send reset link');
      } else {
        setMessage('Check your email for the password reset link!');
        setResendTimer(60);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setResendTimer(60);
    setMessage(null);

    try {
      setLoading(true);
      const response = await fetch('/api/business/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to resend reset link');
        setCanResend(true);
        setResendTimer(0);
      } else {
        setMessage('Reset link sent again! Check your email.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setCanResend(true);
      setResendTimer(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleResetPassword} className="space-y-6">
      <AuthFormContainer className="space-y-5">
        {/* Success Message */}
        <AnimatedAlert
          variant="success"
          message={message || ''}
          isVisible={!!message}
          onDismiss={() => setMessage(null)}
        />

        {/* Error Message */}
        <AnimatedAlert
          variant="error"
          message={error || ''}
          isVisible={!!error}
          onDismiss={() => setError(null)}
        />

        {/* Email Input */}
        <AuthFormField>
          <div className="space-y-2">
            <LuxuryLabel htmlFor="email" className="text-[var(--luxury-pearl)]">
              Business Email
            </LuxuryLabel>
            <LuxuryInput
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || !!message}
              leftIcon={<Mail className="h-4 w-4" />}
              className="auth-input"
            />
          </div>
        </AuthFormField>

        {/* Submit Button */}
        <AuthFormField>
          <button
            type="submit"
            disabled={loading || !!message}
            className="auth-btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </AuthFormField>

        {/* Help Section */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-[var(--luxury-border-subtle)]">
                <div className="flex items-start gap-3 text-sm">
                  <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-[var(--luxury-gold)]" />
                  <div className="space-y-2">
                    <p className="font-medium text-[var(--luxury-pearl)]">
                      Didn&apos;t receive the email?
                    </p>
                    <ul className="space-y-1 text-xs text-[var(--luxury-light-gray)]">
                      <li>Check your spam or junk folder</li>
                      <li>Verify the email address is correct</li>
                      <li>Make sure you have a registered business account</li>
                    </ul>

                    {/* Resend Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={!canResend || loading}
                        className="inline-flex items-center text-xs font-medium text-[var(--luxury-gold)] hover:text-[var(--luxury-gold-light)] disabled:text-[var(--luxury-light-gray)] disabled:cursor-not-allowed transition-colors"
                      >
                        <RefreshCw
                          className={`mr-1.5 h-3 w-3 ${loading ? 'animate-spin' : ''}`}
                        />
                        {resendTimer > 0
                          ? `Resend in ${resendTimer}s`
                          : 'Resend reset link'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
