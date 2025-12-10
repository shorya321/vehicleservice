/**
 * Business Account Login Form Component
 * Handles business user authentication with luxury styling
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

import { LuxuryInput, LuxuryLabel } from '@/components/business/ui/luxury-input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import {
  PasswordInput,
  ForgotPasswordLink,
  AuthFormContainer,
  AuthFormField,
} from '@/components/business/auth';
import { authFormItem } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginInput) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/business/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      toast.success('Welcome back!', {
        description: 'Redirecting to your dashboard...',
      });

      router.push('/business/dashboard');
      router.refresh();
    } catch (error) {
      toast.error('Login failed', {
        description: error instanceof Error ? error.message : 'Invalid credentials',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const MotionWrapper = prefersReducedMotion ? 'div' : motion.div;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <AuthFormContainer className="space-y-5">
          {/* Email Field */}
          <AuthFormField>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <LuxuryLabel className="text-[var(--luxury-pearl)]">
                    Email Address
                  </LuxuryLabel>
                  <FormControl>
                    <LuxuryInput
                      type="email"
                      placeholder="you@company.com"
                      leftIcon={<Mail className="h-4 w-4" />}
                      className="auth-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-sm" />
                </FormItem>
              )}
            />
          </AuthFormField>

          {/* Password Field */}
          <AuthFormField>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <LuxuryLabel className="text-[var(--luxury-pearl)]">
                    Password
                  </LuxuryLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Enter your password"
                      showLockIcon
                      className="auth-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-sm" />
                </FormItem>
              )}
            />
          </AuthFormField>

          {/* Forgot Password Link */}
          <AuthFormField>
            <ForgotPasswordLink />
          </AuthFormField>

          {/* Submit Button */}
          <AuthFormField>
            <MotionWrapper
              {...(!prefersReducedMotion && { variants: authFormItem })}
            >
              <button
                type="submit"
                disabled={isLoading}
                className="auth-btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </MotionWrapper>
          </AuthFormField>
        </AuthFormContainer>
      </form>
    </Form>
  );
}
