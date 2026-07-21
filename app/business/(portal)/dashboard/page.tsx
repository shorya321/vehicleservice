/**
 * Business Dashboard Page
 * Overview of business account metrics and quick actions
 *
 * Design System: Premium B2B experience with refined luxury aesthetic
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getExchangeRates } from '@/lib/currency/server';
import { convertFromAed } from '@/lib/business/wallet-operations';
import { normalizeBusinessRole } from '@/lib/business/api-utils';
import { restrictedToOwnBookings } from '@/lib/business/member-scope';
import { redirect } from 'next/navigation';
import { DashboardContent } from './components/dashboard-content';
import type { PopularRouteData } from './components/analytics-chart';

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
      role,
      business_accounts (
        id,
        business_name,
        brand_name,
        wallet_balance,
        preferred_currency,
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
  const role = normalizeBusinessRole(businessUser.role);
  const isOwner = role === 'owner';
  const businessName = businessUser.business_accounts.brand_name || businessUser.business_accounts.business_name;

  // The wallet is the business's finances - staff never see the balance. Skip
  // the exchange-rate lookup entirely for them so no figure can reach the
  // client bundle at all.
  const walletBalance = isOwner ? Number(businessUser.business_accounts.wallet_balance) || 0 : 0;
  const displayCurrency = businessUser.business_accounts.preferred_currency || 'AED';
  const displayBalance = isOwner
    ? convertFromAed(walletBalance, displayCurrency, await getExchangeRates())
    : 0;

  // Every tile below is scoped to this member. Owners see the whole business;
  // staff see only the bookings they created, so their tiles agree with the
  // list on /business/bookings.
  const bookingScope = restrictedToOwnBookings(role)
    ? { business_account_id: businessAccountId, created_by_user_id: businessUser.id }
    : { business_account_id: businessAccountId };

  // Get booking statistics
  const { count: totalBookings } = await supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .match(bookingScope);

  const { count: pendingBookings } = await supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .match({ ...bookingScope, booking_status: 'pending' });

  const { count: completedBookings } = await supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .match({ ...bookingScope, booking_status: 'completed' });

  // Get this month's bookings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: monthlyBookings } = await supabase
    .from('business_bookings')
    .select('*', { count: 'exact', head: true })
    .match(bookingScope)
    .gte('created_at', startOfMonth.toISOString());

  // Get recent bookings
  const { data: recentBookings } = await supabase
    .from('business_bookings')
    .select('id, booking_number, trip_number, customer_name, pickup_datetime, booking_status, total_price')
    .match(bookingScope)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get popular routes
  const { data: popularRoutesData } = await supabase
    .rpc('get_popular_routes', { limit_count: 5 });

  const popularRoutes: PopularRouteData[] = (popularRoutesData || []).map(route => ({
    id: route.id,
    route_slug: route.route_slug,
    origin_name: route.origin_name,
    origin_city: route.origin_city,
    destination_name: route.destination_name,
    destination_city: route.destination_city,
    distance_km: route.distance_km,
    estimated_duration_minutes: route.estimated_duration_minutes,
  }));

  return (
    <DashboardContent
      businessName={businessName}
      walletBalance={walletBalance}
      displayBalance={displayBalance}
      displayCurrency={displayCurrency}
      totalBookings={totalBookings || 0}
      pendingBookings={pendingBookings || 0}
      completedBookings={completedBookings || 0}
      monthlyBookings={monthlyBookings || 0}
      recentBookings={recentBookings || []}
      popularRoutes={popularRoutes}
      isOwner={isOwner}
    />
  );
}
