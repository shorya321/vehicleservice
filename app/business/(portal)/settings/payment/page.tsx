/**
 * Business Payment Settings Page
 * Configure payment methods and wallet settings
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, PageContainer } from '@/components/business/layout';
import { PaymentSettingsForm } from './components/payment-settings-form';
import type { CurrencyCode } from '@/lib/utils/currency-converter';

export const metadata: Metadata = {
  title: 'Payment Settings | Business Portal',
  description: 'Manage payment methods and wallet settings',
};

export default async function PaymentSettingsPage() {
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
        save_payment_methods,
        payment_element_enabled,
        preferred_currency
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (!businessUser) {
    redirect('/business/login');
  }

  const businessAccount = businessUser.business_accounts;

  // Set defaults if not set
  const settings = {
    save_payment_methods: businessAccount.save_payment_methods ?? true,
    payment_element_enabled: businessAccount.payment_element_enabled ?? true,
    preferred_currency: (businessAccount.preferred_currency as CurrencyCode) || 'USD',
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Payment Settings"
        description="Configure how payment methods are saved and managed for your business"
      />

      {/* Payment Settings Form */}
      <PaymentSettingsForm initialSettings={settings} />
    </PageContainer>
  );
}
