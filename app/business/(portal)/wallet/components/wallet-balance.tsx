'use client';

/**
 * Wallet Balance Component
 * Displays current balance and recharge button
 * Supports both Payment Element (embedded) and Checkout (redirect) flows
 */

import { useState } from 'react';
import { Plus, Loader2, CreditCard, ExternalLink } from 'lucide-react';
import { LuxuryCard, LuxuryCardContent, LuxuryCardHeader, LuxuryCardTitle } from '@/components/business/ui/luxury-card';
import { LuxuryButton } from '@/components/business/ui/luxury-button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
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
      <LuxuryCard>
        <LuxuryCardHeader className="flex flex-row items-center justify-between space-y-0">
          <LuxuryCardTitle>Current Balance</LuxuryCardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <LuxuryButton>
                <Plus className="mr-2 h-4 w-4" />
                Add Credits
              </LuxuryButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Credits to Wallet</DialogTitle>
                <DialogDescription>
                  Enter the amount you want to add to your wallet. Minimum{' '}
                  {formatCurrency(minAmount, currency)}, maximum {formatCurrency(maxAmount, currency)}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Payment Flow Selection (only if Payment Element is enabled) */}
                {paymentElementEnabled && (
                  <Tabs value={selectedFlow} onValueChange={(v) => setSelectedFlow(v as 'embedded' | 'redirect')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="embedded">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Instant Payment
                      </TabsTrigger>
                      <TabsTrigger value="redirect">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Checkout Page
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="embedded" className="text-sm text-muted-foreground mt-2">
                      Pay directly on this page with saved payment methods or add a new one.
                    </TabsContent>
                    <TabsContent value="redirect" className="text-sm text-muted-foreground mt-2">
                      You'll be redirected to Stripe's secure checkout page to complete payment.
                    </TabsContent>
                  </Tabs>
                )}

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({currency})</Label>
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
                  />
                  <p className="text-sm text-muted-foreground">
                    You will be charged: {formatCurrency(parseFloat(amount) || 0, currency)}
                  </p>
                </div>

                {/* Action Button */}
                <LuxuryButton onClick={handleRecharge} disabled={isLoading} className="w-full">
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
                </LuxuryButton>
              </div>
            </DialogContent>
          </Dialog>
        </LuxuryCardHeader>
        <LuxuryCardContent>
          <div className="text-4xl font-bold">{formatCurrency(balance, currency)}</div>
          <p className="text-sm text-muted-foreground mt-2">Available for bookings</p>
        </LuxuryCardContent>
      </LuxuryCard>

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
