'use client';

/**
 * Domain Configuration Component
 * Add or update custom domain
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Globe, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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

  async function handleRemove() {
    if (!currentDomain) return;

    // Confirm before deletion
    const confirmed = confirm(
      `Are you sure you want to remove ${currentDomain}?\n\n` +
      'This will remove the domain from Vercel and your custom domain will no longer work.'
    );

    if (!confirmed) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/business/domain', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove domain');
      }

      toast.success('Domain removed', {
        description: 'Your custom domain has been removed successfully.',
      });

      router.refresh();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to remove domain',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
            <Globe className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Configure Custom Domain
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Use your own domain (e.g., transfers.yourhotel.com) for your booking portal
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="custom_domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Custom Domain</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="transfers.yourhotel.com"
                      {...field}
                      disabled={isVerified}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-sky-500 focus:ring-sky-500/20 disabled:opacity-50"
                    />
                  </FormControl>
                  <FormDescription className="text-muted-foreground">
                    Enter the subdomain you want to use (e.g., transfers.yourhotel.com)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isVerified && (
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              After configuring your DNS records, click the button below to verify.
            </p>
            <Button
              onClick={handleVerify}
              disabled={isVerifying}
              className="bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 hover:border-sky-500/50 disabled:opacity-50"
            >
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
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">Domain verified and active!</p>
            </div>
            <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 mt-1">
              Your booking portal is now accessible at {currentDomain}
            </p>
          </div>
        )}

        {/* Remove Domain Button */}
        {currentDomain && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between rounded-xl bg-muted border border-border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Remove Custom Domain</p>
                <p className="text-sm text-muted-foreground">
                  This will remove your custom domain and revert to subdomain access.
                </p>
              </div>
              <Button
                onClick={handleRemove}
                disabled={isLoading || isVerifying}
                size="sm"
                className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20 hover:border-red-500/50 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Domain
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
