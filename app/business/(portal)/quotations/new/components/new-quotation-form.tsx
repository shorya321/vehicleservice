'use client';

/**
 * Start a quotation.
 *
 * Only the header is captured here. The row is created immediately as a draft and the user
 * is sent to the detail page to add trips — which means a half-built quotation is never lost
 * to a closed tab, and the quotation number exists from the first moment.
 *
 * Email and phone are optional at this stage: an offline quote often begins with nothing but
 * a name from a phone call. They become mandatory only at conversion, where the booking
 * schema requires them.
 */

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { format, parse } from 'date-fns';
import { CalendarDays, Loader2, MessageSquare, User } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// The portal's date control — same one the booking wizard and the wallet filters use.
import { FormDatePicker } from '@/components/ui/form-date-picker';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FieldGroup } from '../../components/field-group';
import { createQuotation } from '../../mutations';

/**
 * The form's own schema: react-hook-form needs concrete defaults, whereas the server schema
 * transforms blanks to undefined. Validation still runs against the same rules server-side.
 */
const formSchema = z.object({
  customer_name: z.string().trim().min(2, 'Customer name required').max(100),
  customer_company: z.string().trim().max(150).optional(),
  customer_email: z.string().trim().email('Invalid email').or(z.literal('')).optional(),
  customer_phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .or(z.literal(''))
    .optional(),
  title: z.string().trim().max(150).optional(),
  valid_until: z.string().optional(),
  default_markup_pct: z.coerce.number().min(-100).max(1000),
  notes: z.string().trim().max(2000).optional(),
});

type FormValues = z.input<typeof formSchema>;

/** Midnight today — a quotation that expires in the past is not a quotation. */
const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0));

interface NewQuotationFormProps {
  /** Business display currency; the AED rate is frozen against it at creation. */
  currency: string;
}

export function NewQuotationForm({ currency }: NewQuotationFormProps) {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: '',
      customer_company: '',
      customer_email: '',
      customer_phone: '',
      title: '',
      valid_until: '',
      default_markup_pct: 20,
      notes: '',
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await createQuotation({
      ...values,
      currency,
      discount_aed: 0,
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Quotation ${result.quotation_number} created`);
    router.push(`/business/quotations/${result.id}`);
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup title="Customer Information" icon={User} tone="bg-primary/10 text-primary">
          {/* items-start so a two-line description under one field cannot stretch its neighbour. */}
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="customer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ahmed Khan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Khan Tours" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="ahmed@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Required later to convert this into bookings.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+971501234567" {...field} />
                  </FormControl>
                  <FormDescription>
                    Required later to convert this into bookings.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FieldGroup>

        <FieldGroup
          title="Quotation Terms"
          icon={CalendarDays}
          tone="bg-sky-500/10 text-sky-500"
        >
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="valid_until"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid until (optional)</FormLabel>
                  <FormControl>
                    {/* The field stays a 'yyyy-MM-dd' string, so the schema and the server
                        action are untouched — only the control changes. */}
                    <FormDatePicker
                      value={
                        field.value
                          ? parse(field.value, 'yyyy-MM-dd', new Date())
                          : undefined
                      }
                      onChange={(date) =>
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                      disabled={(date) => date < startOfToday()}
                      placeholder="Select date"
                      clearable
                    />
                  </FormControl>
                  <FormDescription>
                    After this date the quotation shows as expired.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_markup_pct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default markup %</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" {...field} />
                  </FormControl>
                  <FormDescription>
                    Applied to every trip unless you override it. Internal only — never shown on
                    the PDF.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="March itinerary — Khan family" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FieldGroup>

        <FieldGroup
          title="Optional Information"
          icon={MessageSquare}
          tone="bg-violet-500/10 text-violet-500"
        >
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes for the customer</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Anything to appear on the PDF…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FieldGroup>

        <div className="flex justify-between gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create &amp; add trips
          </Button>
        </div>
      </form>
    </Form>
  );
}
