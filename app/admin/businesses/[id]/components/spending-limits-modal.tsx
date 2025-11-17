'use client';

/**
 * Spending Limits Modal Component
 * Allows admins to configure spending limits for business wallets
 */

import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Settings, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency-converter';

interface SpendingLimitsModalProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  currentLimits: {
    enabled: boolean;
    max_transaction_amount: number | null;
    max_daily_spend: number | null;
    max_monthly_spend: number | null;
  };
  currency: string;
  onSuccess: () => void;
}

export function SpendingLimitsModal({
  open,
  onClose,
  businessId,
  businessName,
  currentLimits,
  currency,
  onSuccess,
}: SpendingLimitsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [enabled, setEnabled] = useState(currentLimits.enabled);
  const [maxTransaction, setMaxTransaction] = useState(
    currentLimits.max_transaction_amount?.toString() || ''
  );
  const [maxDaily, setMaxDaily] = useState(currentLimits.max_daily_spend?.toString() || '');
  const [maxMonthly, setMaxMonthly] = useState(
    currentLimits.max_monthly_spend?.toString() || ''
  );
  const [reason, setReason] = useState('');

  // Reset form when modal opens with new data
  useEffect(() => {
    if (open) {
      setEnabled(currentLimits.enabled);
      setMaxTransaction(currentLimits.max_transaction_amount?.toString() || '');
      setMaxDaily(currentLimits.max_daily_spend?.toString() || '');
      setMaxMonthly(currentLimits.max_monthly_spend?.toString() || '');
      setReason('');
    }
  }, [open, currentLimits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reason.trim().length < 5) {
      toast.error('Reason must be at least 5 characters');
      return;
    }

    // Validate at least one limit is set if enabled
    if (enabled && !maxTransaction && !maxDaily && !maxMonthly) {
      toast.error('Please set at least one spending limit when enabled');
      return;
    }

    // Validate numeric values
    const limits = {
      max_transaction_amount: maxTransaction ? parseFloat(maxTransaction) : null,
      max_daily_spend: maxDaily ? parseFloat(maxDaily) : null,
      max_monthly_spend: maxMonthly ? parseFloat(maxMonthly) : null,
    };

    if (
      (limits.max_transaction_amount !== null && limits.max_transaction_amount <= 0) ||
      (limits.max_daily_spend !== null && limits.max_daily_spend <= 0) ||
      (limits.max_monthly_spend !== null && limits.max_monthly_spend <= 0)
    ) {
      toast.error('All limits must be positive values');
      return;
    }

    // Validate daily <= monthly
    if (
      limits.max_daily_spend !== null &&
      limits.max_monthly_spend !== null &&
      limits.max_daily_spend > limits.max_monthly_spend
    ) {
      toast.error('Daily limit cannot exceed monthly limit');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/wallet/limits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...limits,
          enabled,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update spending limits');
      }

      toast.success('Spending limits updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating spending limits:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update spending limits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLimits = async () => {
    if (!confirm('Are you sure you want to remove all spending limits?')) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/wallet/limits`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove spending limits');
      }

      toast.success('Spending limits removed successfully');
      onSuccess();
    } catch (error) {
      console.error('Error removing spending limits:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove spending limits');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Configure Spending Limits
          </DialogTitle>
          <DialogDescription>
            Set transaction, daily, and monthly spending limits for {businessName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Enable/Disable Switch */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="enabled" className="text-base">
                  Enable Spending Limits
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, transactions will be blocked if limits are exceeded
                </p>
              </div>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={isLoading}
              />
            </div>

            {/* Information Banner */}
            {enabled && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  <p className="font-medium mb-1">Limit Enforcement</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Per-transaction limit: Applies to each individual booking</li>
                    <li>Daily limit: Total spending allowed per calendar day</li>
                    <li>Monthly limit: Total spending allowed per calendar month</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Limits Input Section */}
            <div className="space-y-4">
              {/* Per Transaction Limit */}
              <div className="space-y-2">
                <Label htmlFor="maxTransaction">
                  Maximum Per Transaction ({currency})
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="maxTransaction"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="No limit"
                    value={maxTransaction}
                    onChange={(e) => setMaxTransaction(e.target.value)}
                    className="pl-10"
                    disabled={isLoading || !enabled}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum amount allowed per single booking transaction
                </p>
              </div>

              {/* Daily Limit */}
              <div className="space-y-2">
                <Label htmlFor="maxDaily">
                  Maximum Daily Spend ({currency})
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="maxDaily"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="No limit"
                    value={maxDaily}
                    onChange={(e) => setMaxDaily(e.target.value)}
                    className="pl-10"
                    disabled={isLoading || !enabled}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Total spending allowed per calendar day (00:00 - 23:59)
                </p>
              </div>

              {/* Monthly Limit */}
              <div className="space-y-2">
                <Label htmlFor="maxMonthly">
                  Maximum Monthly Spend ({currency})
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="maxMonthly"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="No limit"
                    value={maxMonthly}
                    onChange={(e) => setMaxMonthly(e.target.value)}
                    className="pl-10"
                    disabled={isLoading || !enabled}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Total spending allowed per calendar month
                </p>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for Changes <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Provide a reason for updating spending limits (minimum 5 characters)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {reason.length}/5 characters minimum
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemoveLimits}
              disabled={isLoading || (!currentLimits.enabled && !enabled)}
              className="sm:mr-auto"
            >
              Remove All Limits
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || reason.trim().length < 5}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Limits
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
