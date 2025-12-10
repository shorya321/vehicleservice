/**
 * Business Wallet Page
 * View wallet balance and transaction history
 *
 * Design System: Premium Indigo - Stripe/Linear inspired
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WalletPageContent } from './components/wallet-page-content';
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
  const walletBalance = Number(businessAccount.wallet_balance) || 0;
  const currency = (businessAccount.preferred_currency as CurrencyCode) || 'USD';
  const paymentElementEnabled = businessAccount.payment_element_enabled ?? true;

  // Get transaction history (8 most recent + total count)
  const { data: transactions, count: totalTransactions } = await supabase
    .from('wallet_transactions')
    .select('*', { count: 'exact' })
    .eq('business_account_id', businessAccountId)
    .order('created_at', { ascending: false })
    .limit(8);

  // Fetch quick stats data
  // 1. Payment methods count
  const { count: paymentMethodsCount } = await supabase
    .from('payment_methods')
    .select('*', { count: 'exact', head: true })
    .eq('business_account_id', businessAccountId)
    .eq('is_active', true);

  // 2. Monthly transaction count (current month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: monthlyTransactionCount } = await supabase
    .from('wallet_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('business_account_id', businessAccountId)
    .gte('created_at', startOfMonth.toISOString());

  // 3. Auto-recharge status
  const { data: autoRechargeConfig } = await supabase
    .from('auto_recharge_settings')
    .select('enabled')
    .eq('business_account_id', businessAccountId)
    .single();

  const quickStats = {
    paymentMethodsCount: paymentMethodsCount || 0,
    monthlyTransactionCount: monthlyTransactionCount || 0,
    autoRechargeEnabled: autoRechargeConfig?.enabled || false,
  };

  return (
    <WalletPageContent
      walletBalance={walletBalance}
      businessAccountId={businessAccountId}
      currency={currency}
      paymentElementEnabled={paymentElementEnabled}
      transactions={transactions || []}
      totalTransactions={totalTransactions}
      quickStats={quickStats}
    />
  );
}
