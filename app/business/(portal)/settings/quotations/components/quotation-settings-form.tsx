'use client';

/**
 * Quotation Settings Form
 * Owner-only control over the quotation number prefix
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FileText, Loader2 } from 'lucide-react';
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
import {
  businessQuotationSettingsSchema,
  QUOTATION_PREFIX_REGEX,
  type BusinessQuotationSettingsInput,
} from '@/lib/business/validators';

interface QuotationSettingsFormProps {
  initialPrefix: string;
}

/** Mirrors TO_CHAR(NOW(), 'MMYY') in generate_quotation_number. */
function currentMonthYear(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  return `${month}${year}`;
}

export function QuotationSettingsForm({ initialPrefix }: QuotationSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BusinessQuotationSettingsInput>({
    resolver: zodResolver(businessQuotationSettingsSchema),
    defaultValues: { quotation_number_prefix: initialPrefix },
  });

  const watchedPrefix = form.watch('quotation_number_prefix');
  const previewPrefix = QUOTATION_PREFIX_REGEX.test(watchedPrefix) ? watchedPrefix : initialPrefix;
  const previewNumber = `${previewPrefix}${currentMonthYear()}0001`;

  async function onSubmit(values: BusinessQuotationSettingsInput) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/business/settings/quotations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update quotation settings');
      }

      toast.success('Quotation settings updated', {
        description: `New quotations will be numbered ${values.quotation_number_prefix}…`,
      });

      router.refresh();
    } catch (error) {
      toast.error('Error', {
        description:
          error instanceof Error ? error.message : 'Failed to update quotation settings',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="bg-card border border-border rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Quotation Numbering
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Set the prefix used at the start of every quotation number
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="quotation_number_prefix"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Quotation Prefix</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="QUO"
                      maxLength={6}
                      autoComplete="off"
                      className="uppercase tracking-widest font-mono"
                      {...field}
                      onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    2-6 letters or digits. Applies to new quotations only - numbers already
                    issued keep the prefix they were created with.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Live preview of the generated number */}
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Your next quotation will look like
              </p>
              <p className="mt-2 font-mono text-lg font-semibold text-foreground">
                {previewNumber}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Prefix, then the month and year, then a running number that restarts each month.
              </p>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
