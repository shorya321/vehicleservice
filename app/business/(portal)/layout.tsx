/**
 * Business Portal Layout
 * Layout wrapper for authenticated business pages
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BusinessSidebar } from './components/business-sidebar';
import { BusinessHeader } from './components/business-header';

export default async function BusinessPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/business/login');
  }

  // Get business user details
  const { data: businessUser, error } = await supabase
    .from('business_users')
    .select(
      `
      id,
      role,
      business_accounts (
        business_name,
        business_email,
        contact_person_name
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (error || !businessUser) {
    redirect('/business/login');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <BusinessSidebar businessName={businessUser.business_accounts.business_name} />

      {/* Main Content Area */}
      <div className="ml-64">
        {/* Header */}
        <BusinessHeader
          userEmail={businessUser.business_accounts.business_email}
          contactPersonName={businessUser.business_accounts.contact_person_name}
        />

        {/* Page Content */}
        <main className="mt-16 p-6">{children}</main>
      </div>
    </div>
  );
}
