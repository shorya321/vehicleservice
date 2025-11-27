/**
 * Business Settings Page
 * Manage business account settings and profile
 *
 * Design System: Premium B2B experience with refined luxury aesthetic
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsPageContent } from './components/settings-page-content';

export const metadata: Metadata = {
  title: 'Settings | Business Portal',
  description: 'Manage your business account settings',
};

export default async function BusinessSettingsPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/business/login');
  }

  // Get business account details
  const { data: businessUser } = await supabase
    .from('business_users')
    .select(
      `
      id,
      role,
      business_account_id,
      business_accounts (
        id,
        business_name,
        business_email,
        business_phone,
        contact_person_name,
        address,
        city,
        country_code,
        subdomain,
        status
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (!businessUser) {
    redirect('/business/login');
  }

  const businessAccount = businessUser.business_accounts;

  return (
    <SettingsPageContent
      businessAccountId={businessAccount.id}
      businessAccount={businessAccount}
      userRole={businessUser.role}
    />
  );
}
