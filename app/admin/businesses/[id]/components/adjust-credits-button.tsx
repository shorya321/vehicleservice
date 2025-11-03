'use client';

/**
 * Adjust Credits Button Component
 * Admin control to add/deduct wallet credits
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/business/wallet-operations';

interface AdjustCreditsButtonProps {
  businessId: string;
  businessName: string;
  currentBalance: number;
}

export function AdjustCreditsButton({
  businessId,
  businessName,
  currentBalance,
}: AdjustCreditsButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleAdjust() {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount === 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid non-zero amount',
        variant: 'destructive',
      });
      return;
    }

    if (reason.trim().length < 10) {
      toast({
        title: 'Invalid reason',
        description: 'Please provide a reason (minimum 10 characters)',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to adjust credits');
      }

      toast({
        title: 'Credits adjusted',
        description: `New balance: ${result.data.new_balance}`,
      });

      setIsDialogOpen(false);
      setAmount('');
      setReason('');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to adjust credits',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const previewBalance = amount ? currentBalance + parseFloat(amount || '0') : currentBalance;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Wallet className="mr-2 h-4 w-4" />
          Adjust Credits
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Wallet Credits</DialogTitle>
          <DialogDescription>
            Add or deduct credits for {businessName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="100 (positive) or -50 (negative)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Use positive numbers to add credits, negative to deduct
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Reason for adjustment (e.g., Promotional credit, Error correction)..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Minimum 10 characters</p>
          </div>

          <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Current Balance:</span>
              <span className="font-medium">{formatCurrency(currentBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span>Adjustment:</span>
              <span className={`font-medium ${parseFloat(amount || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(amount || '0') >= 0 ? '+' : ''}
                {formatCurrency(parseFloat(amount || '0'))}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">New Balance:</span>
              <span className="font-semibold">{formatCurrency(previewBalance)}</span>
            </div>
          </div>

          <Button onClick={handleAdjust} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adjusting...
              </>
            ) : (
              'Confirm Adjustment'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
