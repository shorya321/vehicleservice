'use client';

/**
 * Wallet Balance Component
 * Displays current balance and recharge button
 * Supports both Payment Element (embedded) and Checkout (redirect) flows
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState } from 'react';
import { Plus, Loader2, CreditCard, ExternalLink, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { WalletRechargeModal } from './wallet-recharge-modal';
import {
  formatCurrency,
  getMinimumRechargeAmount,
  getMaximumRechargeAmount,
  type CurrencyCode,
} from '@/lib/utils/currency-converter';

interface WalletBalanceProps {
  balance: number;
  businessAccountId: string;
  currency?: CurrencyCode;
  paymentElementEnabled?: boolean;
}

export function WalletBalance({
  balance,
  businessAccountId,
  currency = 'USD',
  paymentElementEnabled = false,
}: WalletBalanceProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [amount, setAmount] = useState<string>('100');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<'embedded' | 'redirect'>(
    paymentElementEnabled ? 'embedded' : 'redirect'
  );

  const minAmount = getMinimumRechargeAmount(currency);
  const maxAmount = getMaximumRechargeAmount(currency);

  // Handle Payment Element (embedded) flow
  async function handlePaymentElementRecharge() {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount < minAmount || numAmount > maxAmount) {
      toast.error('Invalid amount', {
        description: `Please enter an amount between ${formatCurrency(minAmount, currency)} and ${formatCurrency(maxAmount, currency)}`,
      });
      return;
    }

    setIsDialogOpen(false);
    setIsPaymentModalOpen(true);
  }

  // Handle Stripe Checkout (redirect) flow
  async function handleCheckoutRecharge() {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount < minAmount || numAmount > maxAmount) {
      toast.error('Invalid amount', {
        description: `Please enter an amount between ${formatCurrency(minAmount, currency)} and ${formatCurrency(maxAmount, currency)}`,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/business/wallet/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, currency }),
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

  function handleRecharge() {
    if (selectedFlow === 'embedded') {
      handlePaymentElementRecharge();
    } else {
      handleCheckoutRecharge();
    }
  }

  function handlePaymentSuccess() {
    setIsPaymentModalOpen(false);
    toast.success('Wallet recharged successfully!');
  }

  return (
    <>
      {/* Balance Card */}
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Current Balance
            </CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Credits
              </Button>
            </DialogTrigger>
            {/* Dialog */}
            <DialogContent className="sm:max-w-[500px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground text-xl font-semibold">
                  Add Credits to Wallet
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Enter the amount you want to add to your wallet. Minimum{' '}
                  {formatCurrency(minAmount, currency)}, maximum {formatCurrency(maxAmount, currency)}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Payment Flow Selection (only if Payment Element is enabled) */}
                {paymentElementEnabled && (
                  <Tabs value={selectedFlow} onValueChange={(v) => setSelectedFlow(v as 'embedded' | 'redirect')}>
                    <TabsList className="grid w-full grid-cols-2 bg-muted border border-border">
                      <TabsTrigger
                        value="embedded"
                        className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-muted-foreground"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Instant Payment
                      </TabsTrigger>
                      <TabsTrigger
                        value="redirect"
                        className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-muted-foreground"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Checkout Page
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="embedded" className="text-sm text-muted-foreground mt-3">
                      Pay directly on this page with saved payment methods or add a new one.
                    </TabsContent>
                    <TabsContent value="redirect" className="text-sm text-muted-foreground mt-3">
                      You&apos;ll be redirected to Stripe&apos;s secure checkout page to complete payment.
                    </TabsContent>
                  </Tabs>
                )}

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-foreground text-sm">
                    Amount ({currency})
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min={minAmount}
                    max={maxAmount}
                    step={currency === 'JPY' ? '100' : '10'}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={minAmount.toString()}
                    disabled={isLoading}
                    className="bg-muted border-border text-foreground focus:border-primary focus:ring-primary/20 placeholder:text-muted-foreground"
                  />
                  <p className="text-sm text-muted-foreground">
                    You will be charged:{' '}
                    <span className="text-primary font-semibold">
                      {formatCurrency(parseFloat(amount) || 0, currency)}
                    </span>
                  </p>
                </div>

                {/* Action Button */}
                <Button
                  onClick={handleRecharge}
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : selectedFlow === 'embedded' ? (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Continue to Payment
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Proceed to Checkout
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {formatCurrency(balance, currency)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Available for bookings</p>
        </CardContent>
      </Card>

      {/* Wallet Recharge Modal - Shows saved cards OR payment element */}
      {paymentElementEnabled && (
        <WalletRechargeModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          amount={parseFloat(amount) || 0}
          currency={currency}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
