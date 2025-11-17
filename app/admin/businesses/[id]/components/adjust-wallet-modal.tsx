'use client';

/**
 * Adjust Wallet Modal Component
 * Allows admins to manually credit or debit business wallet
 */

import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils/currency-converter';

interface AdjustWalletModalProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  currentBalance: number;
  currency: string;
  onSuccess: () => void;
}

export function AdjustWalletModal({
  open,
  onClose,
  businessId,
  businessName,
  currentBalance,
  currency,
  onSuccess,
}: AdjustWalletModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(amount);

    // Validation
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (reason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }

    // Calculate final amount (negative for debit)
    const finalAmount = adjustmentType === 'credit' ? numericAmount : -numericAmount;

    // Check if debit would cause negative balance
    if (adjustmentType === 'debit' && numericAmount > currentBalance) {
      toast.error('Debit amount cannot exceed current balance');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/wallet/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalAmount,
          reason: reason.trim(),
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to adjust wallet');
      }

      toast.success(
        `Wallet ${adjustmentType === 'credit' ? 'credited' : 'debited'} successfully`
      );
      onSuccess();
    } catch (error) {
      console.error('Error adjusting wallet:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to adjust wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setAmount('');
      setReason('');
      setAdjustmentType('credit');
      onClose();
    }
  };

  const newBalance =
    adjustmentType === 'credit'
      ? currentBalance + parseFloat(amount || '0')
      : currentBalance - parseFloat(amount || '0');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adjust Wallet Balance</DialogTitle>
          <DialogDescription>
            Manually credit or debit the wallet for {businessName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Current Balance Display */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Current Balance:</span>
              <span className="text-lg font-bold">
                {formatCurrency(currentBalance, currency)}
              </span>
            </div>

            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <RadioGroup
                value={adjustmentType}
                onValueChange={(value) => setAdjustmentType(value as 'credit' | 'debit')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit" id="credit" />
                  <Label htmlFor="credit" className="font-normal cursor-pointer">
                    Credit (Add Funds)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="debit" id="debit" />
                  <Label htmlFor="debit" className="font-normal cursor-pointer">
                    Debit (Remove Funds)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount ({currency}) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* New Balance Preview */}
            {amount && parseFloat(amount) > 0 && (
              <div
                className={`flex items-center justify-between p-3 rounded-lg ${
                  newBalance < 0 ? 'bg-destructive/10' : 'bg-green-50 dark:bg-green-950'
                }`}
              >
                <span className="text-sm font-medium">New Balance:</span>
                <span
                  className={`text-lg font-bold ${
                    newBalance < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {formatCurrency(newBalance, currency)}
                </span>
              </div>
            )}

            {/* Warning for negative balance */}
            {newBalance < 0 && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm text-destructive">
                  <p className="font-medium">Warning: Negative balance not allowed</p>
                  <p>The debit amount exceeds the current balance.</p>
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Provide a detailed reason for this adjustment (minimum 10 characters)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {reason.length}/10 characters minimum
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !amount ||
                parseFloat(amount) <= 0 ||
                reason.trim().length < 10 ||
                newBalance < 0
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {adjustmentType === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
