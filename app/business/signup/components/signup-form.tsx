'use client';

/**
 * Business Account Signup Form Component
 * Handles business registration with validation
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

import { LuxuryButton } from '@/components/business/ui/luxury-button';
import { LuxuryInput } from '@/components/business/ui/luxury-input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  LuxurySelect,
  LuxurySelectContent,
  LuxurySelectItem,
  LuxurySelectTrigger,
  LuxurySelectValue,
} from '@/components/business/ui/luxury-select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { PasswordStrength } from '@/components/business/ui/password-strength';
import {
  businessRegistrationSchema,
  type BusinessRegistrationInput,
} from '@/lib/business/validators';
import { generateSubdomain } from '@/lib/business/domain-utils';
import { countries } from '@/lib/constants/countries';

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedSubdomain, setGeneratedSubdomain] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const form = useForm<BusinessRegistrationInput>({
    resolver: zodResolver(businessRegistrationSchema),
    defaultValues: {
      business_name: '',
      business_email: '',
      business_phone: '',
      contact_person_name: '',
      address: '',
      city: '',
      country_code: '',
      password: '',
    },
  });

  // Auto-generate subdomain when business name changes
  const watchBusinessName = form.watch('business_name');

  useEffect(() => {
    if (watchBusinessName) {
      const subdomain = generateSubdomain(watchBusinessName);
      if (subdomain !== generatedSubdomain) {
        setGeneratedSubdomain(subdomain);
      }
    }
  }, [watchBusinessName, generatedSubdomain]);

  async function onSubmit(values: BusinessRegistrationInput) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/business/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      toast.success('Registration Successful!', {
        description: 'Your account is pending admin approval. Check your email for updates.',
      });

      // Redirect to success page (pending approval)
      router.push('/business/signup/success');
    } catch (error) {
      toast.error('Registration failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-[var(--business-text-primary)]">Business Information</h3>

          <FormField
            control={form.control}
            name="business_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[var(--business-text-secondary)]">Business Name</FormLabel>
                <FormControl>
                  <LuxuryInput placeholder="Acme Hotel & Resort" {...field} />
                </FormControl>
                <FormDescription className="text-[var(--business-text-muted)]">
                  Your subdomain will be: <strong className="text-[var(--business-primary-400)]">{generatedSubdomain || 'your-business'}</strong>
                  .yourdomain.com
                </FormDescription>
                <FormMessage className="text-[var(--business-error)]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="business_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[var(--business-text-secondary)]">Business Email</FormLabel>
                <FormControl>
                  <LuxuryInput type="email" placeholder="contact@acmehotel.com" {...field} />
                </FormControl>
                <FormMessage className="text-[var(--business-error)]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="business_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[var(--business-text-secondary)]">Business Phone</FormLabel>
                <FormControl>
                  <LuxuryInput type="tel" placeholder="+1234567890" {...field} />
                </FormControl>
                <FormDescription className="text-[var(--business-text-muted)]">Include country code (e.g., +1 for US)</FormDescription>
                <FormMessage className="text-[var(--business-error)]" />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Person */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-[var(--business-text-primary)]">Contact Person</h3>

          <FormField
            control={form.control}
            name="contact_person_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[var(--business-text-secondary)]">Full Name</FormLabel>
                <FormControl>
                  <LuxuryInput placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage className="text-[var(--business-error)]" />
              </FormItem>
            )}
          />
        </div>

        {/* Optional Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-[var(--business-text-primary)]">Address (Optional)</h3>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[var(--business-text-secondary)]">Street Address</FormLabel>
                <FormControl>
                  <LuxuryInput placeholder="123 Main St" {...field} />
                </FormControl>
                <FormMessage className="text-[var(--business-error)]" />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--business-text-secondary)]">City</FormLabel>
                  <FormControl>
                    <LuxuryInput placeholder="New York" {...field} />
                  </FormControl>
                  <FormMessage className="text-[var(--business-error)]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[var(--business-text-secondary)]">Country</FormLabel>
                  <LuxurySelect onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <LuxurySelectTrigger>
                        <LuxurySelectValue placeholder="Select a country" />
                      </LuxurySelectTrigger>
                    </FormControl>
                    <LuxurySelectContent className="max-h-[300px]">
                      {countries.map((country) => (
                        <LuxurySelectItem key={country.code} value={country.code}>
                          {country.name}
                        </LuxurySelectItem>
                      ))}
                    </LuxurySelectContent>
                  </LuxurySelect>
                  <FormMessage className="text-[var(--business-error)]" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-[var(--business-text-primary)]">Security</h3>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[var(--business-text-secondary)]">Password</FormLabel>
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
                <PasswordStrength password={field.value || ''} className="mt-2" />
                <FormMessage className="text-[var(--business-error)]" />
              </FormItem>
            )}
          />
        </div>

        {/* Terms Acceptance */}
        <div className="flex items-start space-x-3 py-2">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            className="mt-0.5 border-[var(--business-border-default)] data-[state=checked]:bg-[var(--business-primary-500)] data-[state=checked]:border-[var(--business-primary-500)]"
          />
          <label
            htmlFor="terms"
            className="text-sm text-[var(--business-text-secondary)] leading-relaxed cursor-pointer"
          >
            I agree to the{' '}
            <Link
              href="/terms"
              target="_blank"
              className="text-[var(--business-primary-400)] hover:underline"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              target="_blank"
              className="text-[var(--business-primary-400)] hover:underline"
            >
              Privacy Policy
            </Link>
          </label>
        </div>

        <LuxuryButton type="submit" disabled={isLoading || !acceptedTerms} className="w-full" size="lg">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Business Account'
          )}
        </LuxuryButton>
      </form>
    </Form>
  );
}
