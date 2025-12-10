/**
 * Business Account Signup Form Component
 * Handles business registration with validation
 *
 * SCOPE: Business module ONLY
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

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
import { toast } from 'sonner';
import {
  PasswordInput,
  PasswordStrengthBar,
  AuthFormContainer,
  AuthFormField,
} from '@/components/business/auth';
import { LuxuryCheckbox } from '@/components/business/ui/luxury-checkbox';
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
        <AuthFormContainer className="space-y-6">
          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[var(--luxury-pearl)] font-[family-name:var(--luxury-font-accent)]">
              Business Information
            </h3>

            <AuthFormField>
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--luxury-light-gray)]">Business Name</FormLabel>
                    <FormControl>
                      <LuxuryInput placeholder="Acme Hotel & Resort" className="auth-input" {...field} />
                    </FormControl>
                    <FormDescription className="text-[var(--luxury-light-gray)]/70 text-xs">
                      Your subdomain will be: <strong className="text-[var(--luxury-gold)]">{generatedSubdomain || 'your-business'}</strong>
                      .yourdomain.com
                    </FormDescription>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </AuthFormField>

            {/* Email + Phone - 2 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AuthFormField>
                <FormField
                  control={form.control}
                  name="business_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--luxury-light-gray)]">Business Email</FormLabel>
                      <FormControl>
                        <LuxuryInput type="email" placeholder="contact@acmehotel.com" className="auth-input" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </AuthFormField>

              <AuthFormField>
                <FormField
                  control={form.control}
                  name="business_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--luxury-light-gray)]">Business Phone</FormLabel>
                      <FormControl>
                        <LuxuryInput type="tel" placeholder="+1234567890" className="auth-input" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </AuthFormField>
            </div>
          </div>

          {/* Contact & Address - Merged Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[var(--luxury-pearl)] font-[family-name:var(--luxury-font-accent)]">
              Contact & Address
            </h3>

            {/* Full Name + Street Address - 2 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AuthFormField>
                <FormField
                  control={form.control}
                  name="contact_person_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--luxury-light-gray)]">Full Name</FormLabel>
                      <FormControl>
                        <LuxuryInput placeholder="John Doe" className="auth-input" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </AuthFormField>

              <AuthFormField>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--luxury-light-gray)]">Street Address</FormLabel>
                      <FormControl>
                        <LuxuryInput placeholder="123 Main St" className="auth-input" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </AuthFormField>
            </div>

            {/* City + Country - 2 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AuthFormField>
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--luxury-light-gray)]">City</FormLabel>
                      <FormControl>
                        <LuxuryInput placeholder="New York" className="auth-input" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </AuthFormField>

              <AuthFormField>
                <FormField
                  control={form.control}
                  name="country_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--luxury-light-gray)]">Country</FormLabel>
                      <LuxurySelect onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <LuxurySelectTrigger className="auth-input">
                            <LuxurySelectValue placeholder="Select a country" />
                          </LuxurySelectTrigger>
                        </FormControl>
                        <LuxurySelectContent className="max-h-[300px] bg-[var(--luxury-dark-gray)] border-[var(--luxury-gray)]">
                          {countries.map((country) => (
                            <LuxurySelectItem key={country.code} value={country.code}>
                              {country.name}
                            </LuxurySelectItem>
                          ))}
                        </LuxurySelectContent>
                      </LuxurySelect>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </AuthFormField>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[var(--luxury-pearl)] font-[family-name:var(--luxury-font-accent)]">
              Security
            </h3>
            <AuthFormField>
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--luxury-light-gray)]">Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Create a strong password"
                        showLockIcon
                        className="auth-input"
                        {...field}
                      />
                    </FormControl>
                    <PasswordStrengthBar password={field.value || ''} />
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </AuthFormField>
          </div>

          {/* Terms Acceptance */}
          <AuthFormField>
            <div className="flex items-start space-x-3 py-2">
              <LuxuryCheckbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="terms"
                className="text-sm text-[var(--luxury-light-gray)] leading-relaxed cursor-pointer"
              >
                I agree to the{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-[var(--luxury-gold)] hover:text-[var(--luxury-gold-light)] transition-colors"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-[var(--luxury-gold)] hover:text-[var(--luxury-gold-light)] transition-colors"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
          </AuthFormField>

          {/* Submit Button */}
          <AuthFormField>
            <button
              type="submit"
              disabled={isLoading || !acceptedTerms}
              className="auth-btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Business Account'
              )}
            </button>
          </AuthFormField>
        </AuthFormContainer>
      </form>
    </Form>
  );
}
