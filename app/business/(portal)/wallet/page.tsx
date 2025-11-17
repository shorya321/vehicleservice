/**
 * Business Wallet Page
 * View wallet balance and transaction history
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { WalletBalance } from './components/wallet-balance';
import { TransactionHistory } from './components/transaction-history';
import { PaymentMethodsList } from './components/payment-methods-list';
import { AutoRechargeSettings } from './components/auto-recharge-settings';
import { AutoRechargeHistory } from './components/auto-recharge-history';
import { CheckoutSuccessHandler } from './components/checkout-success-handler';
import type { CurrencyCode } from '@/lib/utils/currency-converter';

export const metadata: Metadata = {
  title: 'Wallet | Business Portal',
  description: 'Manage your business wallet and view transaction history',
};

export default async function BusinessWalletPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/business/login');
  }

  // Get business account with payment settings
  const { data: businessUser } = await supabase
    .from('business_users')
    .select(
      `
      id,
      business_account_id,
      business_accounts (
        id,
        business_name,
        wallet_balance,
        preferred_currency,
        payment_element_enabled
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (!businessUser) {
    redirect('/business/login');
  }

  const businessAccount = businessUser.business_accounts;
  const businessAccountId = businessUser.business_account_id;
  const walletBalance = businessAccount.wallet_balance;
  const currency = (businessAccount.preferred_currency as CurrencyCode) || 'USD';
  const paymentElementEnabled = businessAccount.payment_element_enabled ?? true;

  // Get transaction history (8 most recent + total count)
  const { data: transactions, count: totalTransactions } = await supabase
    .from('wallet_transactions')
    .select('*', { count: 'exact' })
    .eq('business_account_id', businessAccountId)
    .order('created_at', { ascending: false })
    .limit(8);

  return (
    <>
      {/* Handle Checkout Success - Verify Payment and Update Balance */}
      <CheckoutSuccessHandler />

      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Wallet</h1>
          <p className="text-muted-foreground">Manage your prepaid credits and view transactions</p>
        </div>

      {/* Wallet Balance Card */}
      <WalletBalance
        balance={walletBalance}
        businessAccountId={businessAccountId}
        currency={currency}
        paymentElementEnabled={paymentElementEnabled}
      />

      {/* Saved Payment Methods (only if Payment Element is enabled) */}
      {paymentElementEnabled && <PaymentMethodsList />}

      {/* Auto-Recharge Settings (only if Payment Element is enabled) */}
      {paymentElementEnabled && <AutoRechargeSettings />}

      {/* Auto-Recharge History (only if Payment Element is enabled) */}
      {paymentElementEnabled && <AutoRechargeHistory />}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            {totalTransactions && totalTransactions > 8
              ? `Showing 8 most recent transactions of ${totalTransactions} total`
              : 'View your recent wallet activity'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionHistory transactions={transactions || []} />
        </CardContent>
        {totalTransactions && totalTransactions > 8 && (
          <CardFooter className="flex justify-center border-t pt-4">
            <Button variant="outline" asChild>
              <Link href="/business/wallet/transactions">
                View All Transactions ({totalTransactions})
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
      </div>
    </>
  );
}
