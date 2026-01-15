'use client';

/**
 * Edit DateTime Modal Component
 * Modal for modifying booking pickup datetime
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, addHours } from 'date-fns';
import { Clock, CalendarDays, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Alert, AlertDescription } from '@/app/business/(portal)/components/ui/alert';
import { toast } from 'sonner';
import {
  getHoursRemainingToModify,
  MODIFICATION_CUTOFF_HOURS,
} from '@/lib/business/booking-utils';

interface EditDateTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingNumber: string;
  currentDatetime: string;
  onSuccess?: () => void;
}

const formSchema = z.object({
  pickup_datetime: z.string().min(1, 'Pickup date and time is required'),
  reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
});

type FormData = z.infer<typeof formSchema>;

export function EditDateTimeModal({
  open,
  onOpenChange,
  bookingId,
  bookingNumber,
  currentDatetime,
  onSuccess,
}: EditDateTimeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hoursRemaining = getHoursRemainingToModify(currentDatetime);

  // Get minimum datetime (now + 3 hours to allow for future modifications)
  const minDateTime = addHours(new Date(), MODIFICATION_CUTOFF_HOURS);
  const minDateTimeString = format(minDateTime, "yyyy-MM-dd'T'HH:mm");

  // Format current datetime for display
  const currentDatetimeFormatted = format(
    parseISO(currentDatetime),
    'EEEE, MMMM d, yyyy h:mm a'
  );

  // Convert current datetime to local input format
  const currentDatetimeLocal = format(parseISO(currentDatetime), "yyyy-MM-dd'T'HH:mm");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickup_datetime: currentDatetimeLocal,
      reason: '',
    },
  });

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);

    try {
      // Convert datetime-local to ISO format
      const newDatetimeISO = new Date(values.pickup_datetime).toISOString();

      const response = await fetch(`/api/business/bookings/${bookingId}/datetime`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup_datetime: newDatetimeISO,
          reason: values.reason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update booking');
      }

      toast.success('Booking Updated', {
        description: 'The pickup date and time has been updated successfully.',
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update booking datetime:', error);
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to update booking',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Edit Pickup Date & Time
          </DialogTitle>
          <DialogDescription>
            Modify the pickup date and time for booking #{bookingNumber}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Time Remaining Warning */}
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                <strong>{hoursRemaining} hour{hoursRemaining === 1 ? '' : 's'}</strong> remaining to
                modify this booking. Changes must be made at least {MODIFICATION_CUTOFF_HOURS} hours
                before pickup.
              </AlertDescription>
            </Alert>

            {/* Current DateTime Display */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground mb-1">Current Pickup Time</div>
              <div className="font-medium text-foreground">{currentDatetimeFormatted}</div>
            </div>

            {/* New DateTime Input */}
            <FormField
              control={form.control}
              name="pickup_datetime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Pickup Date & Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" min={minDateTimeString} {...field} />
                  </FormControl>
                  <FormDescription>
                    Select the new pickup date and time (must be at least{' '}
                    {MODIFICATION_CUTOFF_HOURS} hours from now)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason (Optional) */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Change (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Customer requested a different time..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Pickup Time'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
