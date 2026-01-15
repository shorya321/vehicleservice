'use client';

/**
 * Details Step Component
 * Enter customer details and booking preferences
 *
 * Design: shadcn/ui theme-aware components
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, CalendarDays, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { BookingFormData } from './booking-wizard';

interface DetailsStepProps {
  formData: Partial<BookingFormData>;
  onUpdate: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const detailsSchema = z.object({
  customer_name: z.string().min(2, 'Customer name is required'),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  customer_notes: z.string().max(500).optional(),
  reference_number: z.string().max(50).optional(),
});

type DetailsFormData = z.infer<typeof detailsSchema>;

export function DetailsStep({ formData, onUpdate, onNext, onBack }: DetailsStepProps) {
  const form = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      customer_name: formData.customer_name || '',
      customer_email: formData.customer_email || '',
      customer_phone: formData.customer_phone || '',
      customer_notes: formData.customer_notes || '',
      reference_number: formData.reference_number || '',
    },
  });

  function onSubmit(values: DetailsFormData) {
    onUpdate({
      ...values,
    });
    onNext();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Information */}
        <div className="space-y-4 p-5 border border-border rounded-xl bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Customer Information</h3>
          </div>

          <FormField
            control={form.control}
            name="customer_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passenger Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customer_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Booking Details */}
        <div className="space-y-4 p-5 border border-border rounded-xl bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
              <CalendarDays className="h-5 w-5 text-sky-500" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Booking Details</h3>
          </div>

        </div>

        {/* Optional Information */}
        <div className="space-y-4 p-5 border border-border rounded-xl bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <MessageSquare className="h-5 w-5 text-violet-500" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Optional Information</h3>
          </div>

          <FormField
            control={form.control}
            name="customer_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any special requests or notes..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reference_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Number</FormLabel>
                <FormControl>
                  <Input placeholder="Your internal reference" {...field} />
                </FormControl>
                <FormDescription>For your internal tracking (optional)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit">Continue to Review</Button>
        </div>
      </form>
    </Form>
  );
}
