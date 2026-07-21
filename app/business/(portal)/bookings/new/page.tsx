/**
 * New Booking Page
 * Multi-step wizard for creating business bookings
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessMember } from '@/lib/business/member-scope';
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

  // Resolve the member through the shared helper so this page enforces the same
  // deactivated-member and inactive-account rules as the rest of the portal.
  const member = await getBusinessMember(supabase, user.id);

  if (!member) {
    redirect('/business/login');
  }

  // Staff create bookings against the business wallet, so both roles see the
  // balance here - this is the one place it is shown to staff.
  const [{ data: account }, { data: locations }] = await Promise.all([
    supabase
      .from('business_accounts')
      .select('wallet_balance')
      .eq('id', member.businessAccountId)
      .single(),
    supabase
      .from('locations')
      .select('id, name, city, location_types(icon_name, name)')
      .eq('is_active', true)
      .order('name'),
  ]);

  if (!account) {
    redirect('/business/login');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--business-text-primary)]">Create New Booking</h1>
        <p className="text-[var(--business-text-muted)]">Book a transfer for your customer</p>
      </div>

      {/* Booking Wizard */}
      <BookingWizard
        businessUserId={member.id}
        businessAccountId={member.businessAccountId}
        walletBalance={account.wallet_balance}
        locations={locations || []}
      />
    </div>
  );
}
