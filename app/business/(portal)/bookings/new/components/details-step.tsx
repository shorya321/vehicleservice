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
  passenger_count: z.number().int().min(1).max(20),
  luggage_count: z.number().int().min(0).max(50),
  customer_notes: z.string().max(500).optional(),
  reference_number: z.string().max(50).optional(),
  amenities_price: z.number().min(0).default(0),
});

type DetailsFormData = z.infer<typeof detailsSchema>;

export function DetailsStep({ formData, onUpdate, onNext, onBack }: DetailsStepProps) {
  const form = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      customer_name: formData.customer_name || '',
      customer_email: formData.customer_email || '',
      customer_phone: formData.customer_phone || '',
      passenger_count: formData.passenger_count || 1,
      luggage_count: formData.luggage_count || 0,
      customer_notes: formData.customer_notes || '',
      reference_number: formData.reference_number || '',
      amenities_price: formData.amenities_price || 0,
    },
  });

  function onSubmit(values: DetailsFormData) {
    // Calculate total price
    const basePrice = formData.base_price || 0;
    const totalPrice = basePrice + values.amenities_price;

    onUpdate({
      ...values,
      total_price: totalPrice,
    });
    onNext();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Information */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold text-foreground">Customer Information</h3>

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
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold text-foreground">Booking Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="passenger_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Passengers</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="luggage_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Luggage Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="amenities_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Amenities Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Extra charges for special requests or amenities</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Optional Information */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold text-foreground">Optional Information</h3>

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
