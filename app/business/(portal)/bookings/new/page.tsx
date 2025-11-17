/**
 * New Booking Page
 * Multi-step wizard for creating business bookings
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BookingWizard } from './components/booking-wizard';

export const metadata: Metadata = {
  title: 'New Booking | Business Portal',
  description: 'Create a new transfer booking',
};

export default async function NewBookingPage() {
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

  // Get locations for selection
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, city')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Create New Booking</h1>
        <p className="text-muted-foreground">Book a transfer for your customer</p>
      </div>

      {/* Booking Wizard */}
      <BookingWizard
        businessUserId={businessUser.id}
        businessAccountId={businessUser.business_account_id}
        walletBalance={businessUser.business_accounts.wallet_balance}
        locations={locations || []}
      />
    </div>
  );
}
