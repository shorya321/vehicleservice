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
  const { data: businessUser } = await supabase
    .from('business_users')
    .select('business_account_id')
    .eq('auth_user_id', user.id)
    .single();

  if (!businessUser) {
    redirect('/business/login');
  }

  // Get bookings
  const { data: bookings } = await supabase
    .from('business_bookings')
    .select(
      `
      id,
      booking_number,
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
    .eq('business_account_id', businessUser.business_account_id)
    .order('created_at', { ascending: false });

  // Get stats for header
  const { count: totalCount } = await supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_account_id', businessUser.business_account_id);

  const { count: pendingCount } = await supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_account_id', businessUser.business_account_id)
    .eq('booking_status', 'pending');

  return (
    <BookingsPageContent
      bookings={bookings || []}
      totalCount={totalCount || 0}
      pendingCount={pendingCount || 0}
    />
  );
}
