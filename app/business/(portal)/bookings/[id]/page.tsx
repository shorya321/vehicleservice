/**
 * Booking Details Page
 * View detailed information about a specific booking
 */

import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingDetails } from './components/booking-details';
import { CancelBookingButton } from './components/cancel-booking-button';

export const metadata: Metadata = {
  title: 'Booking Details | Business Portal',
  description: 'View booking details',
};

interface BookingDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
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

  // Get booking details
  const { data: booking, error } = await supabase
    .from('business_bookings')
    .select(
      `
      *,
      from_locations:from_location_id (name, city, country),
      to_locations:to_location_id (name, city, country),
      vehicle_types (name, description, max_passengers, max_luggage)
    `
    )
    .eq('id', params.id)
    .eq('business_account_id', businessUser.business_account_id)
    .single();

  if (error || !booking) {
    notFound();
  }

  const canCancel = ['pending', 'confirmed'].includes(booking.booking_status);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Booking Details</h1>
          <p className="text-muted-foreground">{booking.booking_number}</p>
        </div>
        {canCancel && <CancelBookingButton bookingId={booking.id} />}
      </div>

      {/* Booking Details */}
      <BookingDetails booking={booking} />
    </div>
  );
}
