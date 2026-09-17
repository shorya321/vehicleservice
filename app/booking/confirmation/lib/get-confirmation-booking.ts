import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * The booking the confirmation page renders, loaded on the admin client because the booking
 * number is the bearer secret (see the invoice route, which relies on the same rule).
 *
 * Shared by `/booking/confirmation/[bookingNumber]` and `/booking/confirmation?booking=`, which
 * used to carry byte-identical copies of this query.
 */
export async function getConfirmationBooking(bookingNumber: string) {
  const adminClient = createAdminClient()

  const { data: booking, error } = await adminClient
    .from('bookings')
    .select(`
      *,
      booking_passengers (
        first_name,
        last_name,
        email,
        phone,
        is_primary
      ),
      booking_amenities (
        amenity_type,
        quantity,
        price,
        addon_id,
        child_ages,
        addon:addons (
          id,
          name,
          icon
        )
      ),
      vehicle_type:vehicle_types (
        id,
        name,
        passenger_capacity,
        luggage_capacity,
        description,
        image_url,
        category:vehicle_categories (
          name
        )
      )
    `)
    .eq('booking_number', bookingNumber)
    .single()

  if (error || !booking) {
    return null
  }

  return booking
}

export interface RouteTiming {
  distance_km: number | null
  estimated_duration_minutes: number | null
}

/**
 * The route's scheduled drive, for the "Arrive about" line. Bookings do not store it, so it is
 * looked up by the same origin and destination the checkout priced against.
 *
 * Never throws and never blocks the page: a booking with no location ids, a route that has since
 * been deactivated, or a failed lookup all return null, and the page simply omits the arrival
 * estimate rather than inventing one.
 */
export async function getRouteTiming(
  fromLocationId: string | null | undefined,
  toLocationId: string | null | undefined,
): Promise<RouteTiming | null> {
  if (!fromLocationId || !toLocationId) return null

  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('routes')
      .select('distance_km, estimated_duration_minutes')
      .eq('origin_location_id', fromLocationId)
      .eq('destination_location_id', toLocationId)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Confirmation route timing lookup failed:', error.message)
      return null
    }

    return data ?? null
  } catch (err) {
    console.error('Confirmation route timing lookup threw:', err)
    return null
  }
}
