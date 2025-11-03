'use client';

/**
 * Wallet Balance Component
 * Displays current balance and recharge button
 */

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/business/wallet-operations';

interface WalletBalanceProps {
  balance: number;
  businessAccountId: string;
}

export function WalletBalance({ balance, businessAccountId }: WalletBalanceProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState<string>('100');
  const [isLoading, setIsLoading] = useState(false);

  async function handleRecharge() {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount < 10 || numAmount > 10000) {
      toast.error('Invalid amount', {
        description: 'Please enter an amount between $10 and $10,000',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/business/wallet/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to process request',
      });
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Current Balance</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Credits
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Credits to Wallet</DialogTitle>
              <DialogDescription>
                Enter the amount you want to add to your wallet. Minimum $10, maximum $10,000.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="10"
                  max="10000"
                  step="10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  You will be charged: {formatCurrency(parseFloat(amount) || 0)}
                </p>
              </div>
              <Button
                onClick={handleRecharge}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Proceed to Payment'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{formatCurrency(balance)}</div>
        <p className="text-sm text-muted-foreground mt-2">Available for bookings</p>
      </CardContent>
    </Card>
  );
}
