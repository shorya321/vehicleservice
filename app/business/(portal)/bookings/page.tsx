/**
 * Business Bookings List Page
 * View all bookings for the business account
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingsTable } from './components/bookings-table';

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">View and manage your transfer bookings</p>
        </div>
        <Button asChild>
          <Link href="/business/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>Complete list of all transfer bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <BookingsTable bookings={bookings || []} />
        </CardContent>
      </Card>
    </div>
  );
}
