'use client';

/**
 * Business Account Login Form Component
 * Handles business user authentication
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

import { LuxuryButton } from '@/components/business/ui/luxury-button';
import { LuxuryInput, LuxuryLabel } from '@/components/business/ui/luxury-input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      toast.success('Success!', {
        description: 'Welcome back to your business portal.',
      });

      // Redirect to business dashboard
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <LuxuryLabel>Business Email</LuxuryLabel>
              <FormControl>
                <LuxuryInput type="email" placeholder="contact@acmehotel.com" {...field} />
              </FormControl>
              <FormMessage className="text-[var(--business-error)]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <LuxuryLabel>Password</LuxuryLabel>
              <FormControl>
                <LuxuryInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...field}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[var(--business-text-muted)] hover:text-[var(--business-text-primary)] transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
              </FormControl>
              <FormMessage className="text-[var(--business-error)]" />
            </FormItem>
          )}
        />

        {/* Forgot Password Link */}
        <div className="text-right">
          <Link
            href="/business/forgot-password"
            className="text-sm text-[var(--business-text-muted)] hover:text-[var(--business-primary-400)] transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        <LuxuryButton type="submit" disabled={isLoading} className="w-full" size="lg">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </LuxuryButton>
      </form>
    </Form>
  );
}
