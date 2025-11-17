'use client';

/**
 * Domain Configuration Component
 * Add or update custom domain
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Globe, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { customDomainSchema, type CustomDomainInput } from '@/lib/business/validators';

interface DomainConfigurationProps {
  businessAccountId: string;
  currentDomain: string | null;
  isVerified: boolean;
}

export function DomainConfiguration({
  businessAccountId,
  currentDomain,
  isVerified,
}: DomainConfigurationProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<CustomDomainInput>({
    resolver: zodResolver(customDomainSchema),
    defaultValues: {
      custom_domain: currentDomain || '',
    },
  });

  async function onSubmit(values: CustomDomainInput) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/business/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to configure domain');
      }

      toast.success('Domain configured', {
        description: 'Please configure your DNS records as instructed below.',
      });

      router.refresh();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to configure domain',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerify() {
    if (!currentDomain) return;

    setIsVerifying(true);

    try {
      const response = await fetch('/api/business/domain/verify', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      if (result.data.verified) {
        toast.success('Domain verified!', {
          description: 'Your custom domain is now active.',
        });
        router.refresh();
      } else {
        toast.error('Verification pending', {
          description: 'DNS records not found yet. Please wait and try again.',
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Verification failed',
      });
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Configure Custom Domain
        </CardTitle>
        <CardDescription>
          Use your own domain (e.g., transfers.yourhotel.com) for your booking portal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="custom_domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Domain</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="transfers.yourhotel.com"
                      {...field}
                      disabled={isVerified}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the subdomain you want to use (e.g., transfers.yourhotel.com)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isVerified && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : currentDomain ? (
                  'Update Domain'
                ) : (
                  'Set Custom Domain'
                )}
              </Button>
            )}
          </form>
        </Form>

        {/* Verification Button */}
        {currentDomain && !isVerified && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              After configuring your DNS records, click the button below to verify.
            </p>
            <Button onClick={handleVerify} disabled={isVerifying} variant="outline">
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify DNS Configuration
                </>
              )}
            </Button>
          </div>
        )}

        {/* Verified Message */}
        {isVerified && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">Domain verified and active!</p>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your booking portal is now accessible at {currentDomain}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
