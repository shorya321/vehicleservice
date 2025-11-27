'use client';

/**
 * Profile Settings Component
 * Update business profile information
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * SCOPE: Business module ONLY
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, User } from 'lucide-react';
import {
  LuxuryCard,
  LuxuryCardHeader,
  LuxuryCardTitle,
  LuxuryCardDescription,
  LuxuryCardContent,
  LuxuryButton,
  LuxuryInput,
} from '@/components/business/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import {
  businessProfileUpdateSchema,
  type BusinessProfileUpdateInput,
} from '@/lib/business/validators';

interface ProfileSettingsProps {
  businessAccountId: string;
  currentData: BusinessProfileUpdateInput;
}

export function ProfileSettings({ businessAccountId, currentData }: ProfileSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BusinessProfileUpdateInput>({
    resolver: zodResolver(businessProfileUpdateSchema),
    defaultValues: currentData,
  });

  async function onSubmit(values: BusinessProfileUpdateInput) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/business/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      toast.success('Profile updated', {
        description: 'Your business profile has been updated successfully.',
      });

      router.refresh();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to update profile',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <LuxuryCard>
      <LuxuryCardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--business-primary-500)]/10">
            <User className="h-5 w-5 text-[var(--business-primary-400)]" />
          </div>
          <div>
            <LuxuryCardTitle>Business Profile</LuxuryCardTitle>
            <LuxuryCardDescription>Update your business information</LuxuryCardDescription>
          </div>
        </div>
      </LuxuryCardHeader>
      <LuxuryCardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Business Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--business-text-secondary)] font-[family-name:var(--business-font-body)]">
                      Business Name
                    </FormLabel>
                    <FormControl>
                      <LuxuryInput placeholder="Acme Hotel & Resort" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--business-text-secondary)] font-[family-name:var(--business-font-body)]">
                      Business Phone
                    </FormLabel>
                    <FormControl>
                      <LuxuryInput type="tel" placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_person_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--business-text-secondary)] font-[family-name:var(--business-font-body)]">
                      Contact Person Name
                    </FormLabel>
                    <FormControl>
                      <LuxuryInput placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address Information */}
            <div className="space-y-4 pt-4 border-t border-[var(--business-border-subtle)]">
              <h3 className="text-sm font-medium text-[var(--business-text-secondary)] font-[family-name:var(--business-font-body)]">
                Address (Optional)
              </h3>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--business-text-secondary)] font-[family-name:var(--business-font-body)]">
                      Street Address
                    </FormLabel>
                    <FormControl>
                      <LuxuryInput placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--business-text-secondary)] font-[family-name:var(--business-font-body)]">
                        City
                      </FormLabel>
                      <FormControl>
                        <LuxuryInput placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[var(--business-text-secondary)] font-[family-name:var(--business-font-body)]">
                        Country Code
                      </FormLabel>
                      <FormControl>
                        <LuxuryInput placeholder="US" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <LuxuryButton type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </LuxuryButton>
          </form>
        </Form>
      </LuxuryCardContent>
    </LuxuryCard>
  );
}
