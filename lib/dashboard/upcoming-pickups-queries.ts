import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { routeLabel } from '@/lib/trips/display'
import { summarizePickups, type PickupRow, type PickupSummary } from '@/lib/dashboard/upcoming-pickups'

/** Same exclusion the bookings page stats use. */
const TEST_BOOKING_PATTERN = 'TEST-%'
const WINDOW_HOURS = 24

export interface UpcomingPickupsResult extends PickupSummary {
  error: string | null
}

/**
 * Trips picking up in the next 24 hours, customer and business together. Each
 * assignment table link is a separate foreign key, so each side embeds its own.
 */
export async function getUpcomingPickups(): Promise<UpcomingPickupsResult> {
  const client = createAdminClient()
  const now = new Date()
  const until = new Date(now.getTime() + WINDOW_HOURS * 60 * 60 * 1000)

  try {
    const [customer, business] = await Promise.all([
      client
        .from('bookings')
        .select(`
          id,
          pickup_datetime,
          trip_type,
          duration_hours,
          customer:profiles!customer_id(full_name),
          from_location:locations!from_location_id(name),
          to_location:locations!to_location_id(name),
          booking_assignments(status)
        `)
        .gte('pickup_datetime', now.toISOString())
        .lt('pickup_datetime', until.toISOString())
        .neq('booking_status', 'cancelled')
        .not('booking_number', 'like', TEST_BOOKING_PATTERN),
      client
        .from('business_bookings')
        .select(`
          id,
          pickup_datetime,
          trip_type,
          duration_hours,
          customer_name,
          from_location:locations!from_location_id(name),
          to_location:locations!to_location_id(name),
          booking_assignments!booking_assignments_business_booking_id_fkey(status)
        `)
        .gte('pickup_datetime', now.toISOString())
        .lt('pickup_datetime', until.toISOString())
        .neq('booking_status', 'cancelled')
        .not('booking_number', 'like', TEST_BOOKING_PATTERN),
    ])
    if (customer.error) throw new Error(customer.error.message)
    if (business.error) throw new Error(business.error.message)

    const rows: PickupRow[] = [
      ...(customer.data ?? []).map((b) => ({
        id: b.id,
        pickupAt: b.pickup_datetime,
        route: routeLabel(b, b.from_location?.name, b.to_location?.name),
        who: b.customer?.full_name || 'Guest',
        source: 'customer' as const,
        assignments: b.booking_assignments,
      })),
      ...(business.data ?? []).map((b) => ({
        id: b.id,
        pickupAt: b.pickup_datetime,
        route: routeLabel(b, b.from_location?.name, b.to_location?.name),
        who: b.customer_name || 'Business Guest',
        source: 'business' as const,
        assignments: b.booking_assignments,
      })),
    ]

    return { ...summarizePickups(rows), error: null }
  } catch (error: unknown) {
    console.error('[dashboard] upcoming pickups failed:', error)
    return {
      items: [],
      total: 0,
      withoutVendor: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
