/**
 * Business Dashboard Page
 * Overview of business account metrics and quick actions
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Wallet, CalendarCheck, Plus, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/business/wallet-operations';

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
  const walletBalance = businessUser.business_accounts.wallet_balance;

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

  // Get recent bookings
  const { data: recentBookings } = await supabase
    .from('business_bookings')
    .select('id, booking_number, customer_name, pickup_datetime, booking_status, total_price')
    .eq('business_account_id', businessAccountId)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back to {businessUser.business_accounts.business_name}
          </p>
        </div>
        <Button asChild>
          <Link href="/business/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Wallet Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(walletBalance)}</div>
            <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0">
              <Link href="/business/wallet">Add credits</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        {/* Pending Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting assignment</p>
          </CardContent>
        </Card>

        {/* Completed Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedBookings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Your latest transfer bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {!recentBookings || recentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first booking to get started
              </p>
              <Button asChild>
                <Link href="/business/bookings/new">Create Booking</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{booking.booking_number}</p>
                    <p className="text-sm text-muted-foreground">{booking.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.pickup_datetime).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(booking.total_price)}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {booking.booking_status}
                    </p>
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link href="/business/bookings">View All Bookings</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
