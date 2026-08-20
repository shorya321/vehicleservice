'use client';

/**
 * Cancel Booking Button Component
 * Handle booking cancellation. Cancelling does not move money.
 *
 * Design System: Premium Admin Panel with Gold Accent
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/business/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/business/wallet-operations';

interface CancelBookingButtonProps {
  bookingId: string;
  bookingStatus: string;
  pickupDatetime: string;
  walletDeductionAmount: number;
}

export function CancelBookingButton({
  bookingId,
  bookingStatus,
  pickupDatetime,
  walletDeductionAmount,
}: CancelBookingButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleCancel() {
    if (cancellationReason.trim().length < 10) {
      toast.error('Invalid reason', {
        description: 'Please provide a reason (minimum 10 characters)',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/business/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellation_reason: cancellationReason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel booking');
      }

      // Report what actually happened. A cancellation inside the free-cancellation window
      // returns nothing, and claiming otherwise is exactly the failure this work removed.
      toast.success('Booking cancelled', {
        description: result.data.refund_reason,
      });

      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to cancel booking',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 px-4 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Cancel Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        {/* Custom Header with Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Cancel Booking</h3>
            <p className="text-sm text-muted-foreground">This action cannot be undone</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to cancel this booking?
        </p>

        {/* What happens to the money, stated BEFORE confirming rather than discovered
            afterwards. Cancelling returns nothing on its own; a refund is a decision our
            team makes. */}
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
          {walletDeductionAmount > 0 ? (
            <>
              The <strong>{formatCurrency(walletDeductionAmount)}</strong> held for this booking
              will not be returned to your wallet automatically. Refunds are reviewed and issued
              by our team.
            </>
          ) : (
            'Nothing was charged to your wallet for this booking.'
          )}
        </div>

        {/* Cancellation Reason */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="reason" className="text-sm font-medium text-foreground">
            Reason for cancellation
          </Label>
          <Textarea
            id="reason"
            placeholder="Please provide a reason for cancellation..."
            rows={4}
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            disabled={isLoading}
            className="resize-none rounded-lg bg-muted border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm"
          />
          <p className="text-xs text-muted-foreground">Minimum 10 characters</p>
        </div>

        <DialogFooter className="flex-row justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            disabled={isLoading}
            className="rounded-lg"
          >
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Booking
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
