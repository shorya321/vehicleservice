/**
 * Business Activity page.
 *
 * Owner only. Activity spans wallet amounts, staff actions and platform
 * decisions about the account, so it follows the same rule as the wallet:
 * staff are redirected to the dashboard. The API routes enforce the same thing
 * independently, and RLS enforces it a third time.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getExchangeRates } from '@/lib/currency/server';
import type { CurrencyCode } from '@/lib/utils/currency-converter';
import { ActivityContent } from './components/activity-content';

export const metadata: Metadata = {
  title: 'Activity | Business Portal',
  description: 'Every action taken in your business account',
};

export default async function BusinessActivityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/business/login');
  }

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
        preferred_currency
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (!businessUser) {
    redirect('/business/login');
  }

  if (businessUser.role !== 'owner') {
    redirect('/business/dashboard');
  }

  const businessAccount = businessUser.business_accounts;
  const displayCurrency = (businessAccount?.preferred_currency as CurrencyCode) || 'AED';
  const exchangeRates = await getExchangeRates();

  // Includes deactivated members on purpose: history stays searchable by the
  // person who made it, even after they lose access.
  const { data: members } = await supabase
    .from('business_users')
    .select('id, full_name, email')
    .eq('business_account_id', businessUser.business_account_id)
    .order('created_at', { ascending: true });

  return (
    <ActivityContent
      businessName={businessAccount?.business_name ?? 'your business'}
      displayCurrency={displayCurrency}
      exchangeRates={exchangeRates}
      members={(members ?? []).map((member) => ({
        id: member.id,
        label: member.full_name || member.email || 'Team member',
      }))}
    />
  );
}
