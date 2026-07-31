/**
 * Business Quotation Settings Page
 * Configure the prefix used when issuing quotation numbers
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader, PageContainer } from '@/components/business/layout';
import { QuotationSettingsForm } from './components/quotation-settings-form';

export const metadata: Metadata = {
  title: 'Quotation Settings | Business Portal',
  description: 'Configure the prefix used for your quotation numbers',
};

export default async function QuotationSettingsPage() {
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
        quotation_number_prefix
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (!businessUser) {
    redirect('/business/login');
  }

  // Document numbering is a branding surface for the whole account - owner only.
  if (businessUser.role !== 'owner') {
    redirect('/business/dashboard');
  }

  const prefix = businessUser.business_accounts?.quotation_number_prefix || 'QUO';

  return (
    <PageContainer>
      <PageHeader
        title="Quotation Settings"
        description="Choose the prefix that appears at the start of every quotation number you issue"
      />

      <QuotationSettingsForm initialPrefix={prefix} />
    </PageContainer>
  );
}
