'use client';

/**
 * Wallet Page Content - Client Wrapper
 * Orchestrates animations and client-side interactions for wallet page
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CreditCard, Loader2, ExternalLink, Wallet, Activity } from 'lucide-react';
import { FadeIn } from '@/components/business/motion/fade-in';
import { StaggerContainer, StaggerItem } from '@/components/business/motion/stagger-container';
import { HeroStatCard } from '@/components/business/ui';
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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, PageContainer } from '@/components/business/layout';
import { TransactionHistory } from './transaction-history';
import { PaymentMethodsList } from './payment-methods-list';
import { AutoRechargeSettings } from './auto-recharge-settings';
import { AutoRechargeHistory } from './auto-recharge-history';
import { CheckoutSuccessHandler } from './checkout-success-handler';
import { WalletRechargeModal } from './wallet-recharge-modal';
import { staggerContainer, staggerItem } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  getMinimumRechargeAmount,
  getMaximumRechargeAmount,
  type CurrencyCode,
} from '@/lib/utils/currency-converter';

interface WalletTransaction {
  id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
  balance_after: number;
}

interface WalletQuickStatsData {
  paymentMethodsCount: number;
  monthlyTransactionCount: number;
  autoRechargeEnabled: boolean;
}

interface WalletPageContentProps {
  walletBalance: number;
  businessAccountId: string;
  currency: CurrencyCode;
  paymentElementEnabled: boolean;
  transactions: WalletTransaction[];
  totalTransactions: number | null;
  quickStats?: WalletQuickStatsData;
}

export function WalletPageContent({
  walletBalance,
  businessAccountId,
  currency,
  paymentElementEnabled,
  transactions,
  totalTransactions,
  quickStats,
}: WalletPageContentProps) {
  const prefersReducedMotion = useReducedMotion();

  // Add Credits Dialog State
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

  function handleAddCreditsClick() {
    setIsDialogOpen(true);
  }

  return (
    <>
      {/* Handle Checkout Success */}
      <CheckoutSuccessHandler />

      <PageContainer>
        {/* Page Header */}
        <PageHeader
          title="Wallet"
          description="Manage your prepaid credits and view transactions"
        />

        {/* Stats Row - Matching Bookings Page Pattern */}
        <motion.div
          variants={prefersReducedMotion ? undefined : staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <motion.div key="wallet-balance" variants={prefersReducedMotion ? undefined : staggerItem} className="h-full">
            <HeroStatCard
              title="Wallet Balance"
              value={walletBalance}
              format="currency"
              currency={currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency}
              subtitle="Available for bookings"
              icon={<Wallet className="h-5 w-5" />}
              actionLabel="Add Credits"
              onAction={handleAddCreditsClick}
            />
          </motion.div>
          <motion.div key="payment-methods" variants={prefersReducedMotion ? undefined : staggerItem} className="h-full">
            <HeroStatCard
              title="Payment Methods"
              value={quickStats?.paymentMethodsCount ?? 0}
              subtitle="Saved cards"
              icon={<CreditCard className="h-5 w-5" />}
              variant="info"
            />
          </motion.div>
          <motion.div key="monthly-transactions" variants={prefersReducedMotion ? undefined : staggerItem} className="h-full">
            <HeroStatCard
              title="This Month"
              value={quickStats?.monthlyTransactionCount ?? 0}
              subtitle="Transactions"
              icon={<Activity className="h-5 w-5" />}
              variant={quickStats?.autoRechargeEnabled ? 'success' : 'default'}
            />
          </motion.div>
        </motion.div>

        {/* Two Column Grid: Payment Methods & Auto-Recharge */}
        {paymentElementEnabled && (
          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-6" delay={0.3}>
            <StaggerItem>
              <PaymentMethodsList />
            </StaggerItem>
            <StaggerItem>
              <AutoRechargeSettings />
            </StaggerItem>
          </StaggerContainer>
        )}

        {/* Auto-Recharge History */}
        {paymentElementEnabled && (
          <FadeIn delay={0.4}>
            <AutoRechargeHistory />
          </FadeIn>
        )}

        {/* Recent Transactions */}
        <FadeIn delay={0.5}>
          <Card className="bg-card border border-border rounded-xl shadow-sm">
            <CardHeader className="p-5 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  RECENT TRANSACTIONS
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalTransactions && totalTransactions > 8
                    ? `Showing 8 most recent of ${totalTransactions} total`
                    : 'View your recent wallet activity'}
                </p>
              </div>
              {totalTransactions && totalTransactions > 8 && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-primary hover:text-foreground hover:bg-muted px-3 py-1.5 font-medium"
                >
                  <Link href="/business/wallet/transactions">
                    VIEW ALL
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <TransactionHistory transactions={transactions} />
            </CardContent>
          </Card>
        </FadeIn>
      </PageContainer>

      {/* Add Credits Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl font-semibold">
              Add Credits to Wallet
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the amount you want to add to your wallet. Minimum{' '}
              {formatCurrency(minAmount, currency)}, maximum {formatCurrency(maxAmount, currency)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Payment Flow Selection (only if Payment Element is enabled) */}
            {paymentElementEnabled && (
              <Tabs
                value={selectedFlow}
                onValueChange={(v) => setSelectedFlow(v as 'embedded' | 'redirect')}
              >
                <TabsList className="grid w-full grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                  <TabsTrigger
                    value="embedded"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground rounded-lg"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Instant Payment
                  </TabsTrigger>
                  <TabsTrigger
                    value="redirect"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground rounded-lg"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Checkout Page
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="embedded">
                  <p className="text-sm text-muted-foreground mt-3">
                    Pay directly on this page with saved payment methods or add a new one.
                  </p>
                </TabsContent>
                <TabsContent value="redirect">
                  <p className="text-sm text-muted-foreground mt-3">
                    You&apos;ll be redirected to Stripe&apos;s secure checkout page to complete payment.
                  </p>
                </TabsContent>
              </Tabs>
            )}

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground text-sm font-medium">
                Amount ({currency})
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '¥'}
                </span>
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
                  className="pl-8 bg-muted border-border text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                You will be charged:{' '}
                <span className="text-primary font-semibold">
                  {formatCurrency(parseFloat(amount) || 0, currency)}
                </span>
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              {[50, 100, 250, 500].map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  disabled={isLoading}
                  className={cn(
                    'flex-1 h-9 rounded-lg border text-sm transition-all duration-200',
                    parseFloat(amount) === quickAmount
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5'
                  )}
                >
                  {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '¥'}
                  {quickAmount}
                </button>
              ))}
            </div>

            {/* Action Button */}
            <Button
              onClick={handleRecharge}
              disabled={isLoading}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
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
