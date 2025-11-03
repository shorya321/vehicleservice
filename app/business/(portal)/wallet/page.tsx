/**
 * Business Wallet Page
 * View wallet balance and transaction history
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletBalance } from './components/wallet-balance';
import { TransactionHistory } from './components/transaction-history';

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

  // Get business account
  const { data: businessUser } = await supabase
    .from('business_users')
    .select(
      `
      id,
      business_account_id,
      business_accounts (
        id,
        business_name,
        wallet_balance
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (!businessUser) {
    redirect('/business/login');
  }

  const businessAccountId = businessUser.business_account_id;
  const walletBalance = businessUser.business_accounts.wallet_balance;

  // Get transaction history
  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('business_account_id', businessAccountId)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">Manage your prepaid credits and view transactions</p>
      </div>

      {/* Wallet Balance Card */}
      <WalletBalance balance={walletBalance} businessAccountId={businessAccountId} />

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View all wallet transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionHistory transactions={transactions || []} />
        </CardContent>
      </Card>
    </div>
  );
}
