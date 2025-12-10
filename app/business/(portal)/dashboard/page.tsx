/**
 * Business Dashboard Page
 * Overview of business account metrics and quick actions
 *
 * Design System: Premium B2B experience with refined luxury aesthetic
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { DashboardContent } from './components/dashboard-content';

export const metadata: Metadata = {
  title: 'Dashboard | Business Portal',
  description: 'Business account overview and metrics',
};

export default async function BusinessDashboardPage() {
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
      business_account_id,
      business_accounts (
        id,
        business_name,
        brand_name,
        wallet_balance,
        subdomain
      )
    `
    )
    .eq('auth_user_id', user.id)
    .single();

  if (!businessUser) {
    redirect('/business/login');
  }

  const businessAccountId = businessUser.business_account_id;
  const walletBalance = Number(businessUser.business_accounts.wallet_balance) || 0;
  const businessName = businessUser.business_accounts.brand_name || businessUser.business_accounts.business_name;

  // Get booking statistics
  const { count: totalBookings } = await supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_account_id', businessAccountId);

  const { count: pendingBookings } = await supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_account_id', businessAccountId)
    .eq('booking_status', 'pending');

  const { count: completedBookings } = await supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_account_id', businessAccountId)
    .eq('booking_status', 'completed');

  // Get this month's bookings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: monthlyBookings } = await supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('business_account_id', businessAccountId)
    .gte('created_at', startOfMonth.toISOString());

  // Get recent bookings
  const { data: recentBookings } = await supabase
    .from('business_bookings')
    .select('id, booking_number, customer_name, pickup_datetime, booking_status, total_price')
    .eq('business_account_id', businessAccountId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get all available locations with booking counts
  const { data: locationsData } = await supabase
    .rpc('get_locations_with_booking_counts')
    .limit(6);

  // Fallback: if RPC doesn't exist, fetch locations directly
  let locations = locationsData || [];
  if (!locationsData || locationsData.length === 0) {
    const { data: rawLocations } = await supabase
      .from('locations')
      .select('id, name, type, city, country_code')
      .eq('is_active', true)
      .order('name')
      .limit(6);

    locations = (rawLocations || []).map(loc => ({
      ...loc,
      booking_count: 0
    }));
  }

  return (
    <DashboardContent
      businessName={businessName}
      walletBalance={walletBalance}
      totalBookings={totalBookings || 0}
      pendingBookings={pendingBookings || 0}
      completedBookings={completedBookings || 0}
      monthlyBookings={monthlyBookings || 0}
      recentBookings={recentBookings || []}
      locations={locations}
    />
  );
}
