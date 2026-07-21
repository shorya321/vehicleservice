/**
 * Business Bookings List Page
 * View all bookings for the business account
 *
 * Design System: Premium B2B experience with refined luxury aesthetic
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Plus, CalendarCheck } from 'lucide-react';
import { getBusinessMember, restrictedToOwnBookings } from '@/lib/business/member-scope';
import { BookingsPageContent } from './components/bookings-page-content';

export const metadata: Metadata = {
  title: 'Bookings | Business Portal',
  description: 'View and manage your transfer bookings',
};

export default async function BusinessBookingsPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/business/login');
  }

  // Get business account
  const member = await getBusinessMember(supabase, user.id);

  if (!member) {
    redirect('/business/login');
  }

  // Staff only ever see the bookings they created themselves. The same scope
  // has to be applied to the header counts below, or the totals contradict the
  // list they are sitting above.
  const ownBookingsOnly = restrictedToOwnBookings(member.role);

  // Get bookings
  let bookingsQuery = supabase
    .from('business_bookings')
    .select(
      `
      id,
      booking_number,
      trip_number,
      customer_name,
      customer_email,
      pickup_datetime,
      booking_status,
      total_price,
      from_locations:from_location_id (name, city),
      to_locations:to_location_id (name, city),
      vehicle_types (name),
      created_at
    `
    )
    .eq('business_account_id', member.businessAccountId);

  if (ownBookingsOnly) {
    bookingsQuery = bookingsQuery.eq('created_by_user_id', member.id);
  }

  const { data: bookings } = await bookingsQuery.order('created_at', { ascending: false });

  // Get stats for header
  let totalQuery = supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_account_id', member.businessAccountId);

  if (ownBookingsOnly) {
    totalQuery = totalQuery.eq('created_by_user_id', member.id);
  }

  const { count: totalCount } = await totalQuery;

  let pendingQuery = supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_account_id', member.businessAccountId)
    .eq('booking_status', 'pending');

  if (ownBookingsOnly) {
    pendingQuery = pendingQuery.eq('created_by_user_id', member.id);
  }

  const { count: pendingCount } = await pendingQuery;

  return (
    <BookingsPageContent
      bookings={bookings || []}
      totalCount={totalCount || 0}
      pendingCount={pendingCount || 0}
    />
  );
}
