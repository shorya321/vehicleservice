/**
 * Business Transactions Page
 * Advanced transaction filtering, search, and export
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getExchangeRates } from '@/lib/currency/server';
import { TransactionsContent } from './components/transactions-content';
import type { CurrencyCode } from '@/lib/utils/currency-converter';

export const metadata: Metadata = {
  title: 'Transactions | Business Portal',
  description: 'View and manage your wallet transactions with advanced filtering',
};

export default async function BusinessTransactionsPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/business/login');
  }

  // Get business account
  const { data: businessUser } = await supabase
    .from('business_users')
    .select(
      `
      id,
      business_account_id,
      role,
      business_accounts (
        id,
        business_name,
        wallet_balance,
        preferred_currency
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (!businessUser) {
    redirect('/business/login');
  }

  // Transaction history is business financial data - owner only.
  if (businessUser.role !== 'owner') {
    redirect('/business/dashboard');
  }

  const businessAccount = businessUser.business_accounts;
  const businessAccountId = businessUser.business_account_id;
  const displayCurrency = (businessAccount.preferred_currency as CurrencyCode) || 'AED';
  const exchangeRates = await getExchangeRates();
  const businessName = businessAccount.business_name;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1
          className="text-3xl font-bold text-[var(--business-text-primary)] font-display"
        >
          Transactions
        </h1>
        <p className="text-[var(--business-text-muted)]">
          Advanced filtering, search, and export of your wallet transactions
        </p>
      </div>

      {/* Transactions Content (Client Component) */}
      <TransactionsContent
        businessAccountId={businessAccountId}
        displayCurrency={displayCurrency}
        exchangeRates={exchangeRates}
        businessName={businessName}
      />
    </div>
  );
}
