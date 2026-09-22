import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { GROUP_NUMBER_PREFIX } from '@/lib/trips/constants'
import { legLabel } from '@/lib/trips/display'

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

export interface ConfirmationTripLeg {
  id: string
  label: string
  pickup_address: string
  dropoff_address: string
  pickup_datetime: string
  trip_number: string | null
  booking_status: string
}

export interface ConfirmationTrip {
  groupNumber: string
  tripType: string
  legs: ConfirmationTripLeg[]
  discount: number
  discountPercent: number
}

/**
 * A round trip or multi-city trip as the confirmation page shows it: the first journey's
 * booking (for the vehicle, passengers and extras), re-stated for the whole trip (the group's
 * reference, status and total), plus every journey.
 *
 * Accepts the group number or any journey's own booking number, so an old link to one
 * journey still lands on the whole trip.
 */
export async function getConfirmationTrip(reference: string) {
  const adminClient = createAdminClient()

  let groupId: string | null = null
  if (reference.startsWith(GROUP_NUMBER_PREFIX)) {
    const { data } = await adminClient.from('booking_groups').select('id').eq('group_number', reference).maybeSingle()
    groupId = data?.id ?? null
  } else {
    const { data } = await adminClient.from('bookings').select('booking_group_id').eq('booking_number', reference).maybeSingle()
    groupId = data?.booking_group_id ?? null
  }
  if (!groupId) return null

  const [{ data: group }, { data: legs }] = await Promise.all([
    adminClient
      .from('booking_groups')
      .select('id, group_number, trip_type, total_price, discount_amount, discount_percent, payment_status, booking_status, paid_at')
      .eq('id', groupId)
      .single(),
    adminClient
      .from('bookings')
      .select('id, booking_number, trip_number, trip_type, leg_index, pickup_address, dropoff_address, pickup_datetime, booking_status, amenities_price')
      .eq('booking_group_id', groupId)
      .order('leg_index', { ascending: true }),
  ])
  if (!group || !legs || legs.length === 0) return null

  const lead = await getConfirmationBooking(legs[0].booking_number)
  if (!lead) return null

  const legCount = legs.length
  const amenitiesTotal = legs.reduce((sum, leg) => sum + Number(leg.amenities_price ?? 0), 0)
  const total = Number(group.total_price)
  const activeLegs = legs.filter((leg) => leg.booking_status !== 'cancelled')

  const booking = {
    ...lead,
    booking_number: group.group_number,
    trip_number: group.group_number,
    payment_status: group.payment_status,
    // The trip reads as cancelled only once every journey is.
    booking_status: activeLegs.length === 0 ? 'cancelled' : lead.booking_status === 'cancelled' ? activeLegs[0].booking_status : lead.booking_status,
    paid_at: group.paid_at,
    total_price: total,
    base_price: Math.round((total - amenitiesTotal) * 100) / 100,
    booking_amenities: (lead.booking_amenities ?? []).map((amenity) => ({
      ...amenity,
      price: Number(amenity.price) * legCount,
    })),
  }

  const trip: ConfirmationTrip = {
    groupNumber: group.group_number,
    tripType: group.trip_type,
    discount: Number(group.discount_amount),
    discountPercent: Number(group.discount_percent),
    legs: legs.map((leg) => ({
      id: leg.id,
      label: legLabel(leg, legCount) ?? 'Journey',
      pickup_address: leg.pickup_address,
      dropoff_address: leg.dropoff_address,
      pickup_datetime: leg.pickup_datetime,
      trip_number: leg.trip_number,
      booking_status: leg.booking_status,
    })),
  }

  return { booking, trip }
}
