/**
 * Booking Details Page
 * View detailed information about a specific booking
 */

import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingDetails } from './components/booking-details';
import { CancelBookingButton } from './components/cancel-booking-button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Booking Details | Business Portal',
  description: 'View booking details',
};

interface BookingDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  // Use admin client to bypass RLS for booking_assignments
  // Security is already enforced by checking business_account_id above
  const adminClient = createAdminClient();

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

  // Get booking details without joins
  const { data: booking, error: bookingError } = await supabase
    .from('business_bookings')
    .select('*')
    .eq('id', id)
    .eq('business_account_id', businessUser.business_account_id)
    .single();

  if (bookingError || !booking) {
    notFound();
  }

  // Fetch related data separately (including vendor assignment)
  const [fromLocation, toLocation, vehicleType, assignments] = await Promise.all([
    supabase
      .from('locations')
      .select('name, city')
      .eq('id', booking.from_location_id)
      .single(),
    supabase
      .from('locations')
      .select('name, city')
      .eq('id', booking.to_location_id)
      .single(),
    supabase
      .from('vehicle_types')
      .select('name, description, passenger_capacity, luggage_capacity, vehicle_categories:category_id(name)')
      .eq('id', booking.vehicle_type_id)
      .single(),
    adminClient
      .from('booking_assignments')
      .select(`
        id,
        status,
        assigned_at,
        accepted_at,
        completed_at,
        vendor:vendor_applications(business_name, business_phone, business_email),
        driver:vendor_drivers(first_name, last_name, phone),
        vehicle:vehicles(make, model, year, registration_number)
      `)
      .eq('business_booking_id', id)
      .order('created_at', { ascending: false }),
  ]);

  // Construct the booking object with joined data (with fallbacks)
  const bookingWithRelations = {
    ...booking,
    from_locations: fromLocation.data || { name: 'Unknown', city: 'Unknown' },
    to_locations: toLocation.data || { name: 'Unknown', city: 'Unknown' },
    vehicle_types: vehicleType.data || {
      name: 'Unknown',
      description: '',
      passenger_capacity: 0,
      luggage_capacity: 0,
      vehicle_categories: { name: 'Unknown' }
    },
    booking_assignments: assignments.data || [],
  };

  const canCancel = ['pending', 'confirmed'].includes(booking.booking_status);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">Booking Details</h1>
          <p className="text-muted-foreground">{booking.booking_number}</p>
        </div>
        {canCancel && <CancelBookingButton bookingId={id} />}
      </div>

      {/* Booking Details */}
      <BookingDetails booking={bookingWithRelations} />
    </div>
  );
}
