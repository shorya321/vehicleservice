import { createAdminClient } from '@/lib/supabase/admin'
import { startOfBookingDayUtc } from '@/lib/utils/timezone'
import type { PastBookingAssignment } from './service'

/**
 * Online bookings offered to this vendor that they have not yet answered.
 *
 * Why these need their own source: `resource_schedules` rows are written only when
 * the vendor ACCEPTS (`AvailabilityService.createSchedule`, called from
 * `app/vendor/bookings/actions.ts`). Until then the offer holds nothing and appears
 * nowhere on the calendar, so a vendor can sell the same slot offline and discover
 * the clash only when the database refuses it.
 *
 * A pending assignment names no resources. `lib/bookings/unified-service.ts` inserts
 * it with booking_id / business_booking_id / vendor_id / assigned_by / status only;
 * `vehicle_id`, `driver_id` and `estimated_duration_hours` are all set for the first
 * time at acceptance. Three consequences the callers must respect:
 *
 *   1. It cannot be drawn on a vehicle or driver lane. It belongs to neither.
 *   2. It never counts as occupancy (`occupies: false`).
 *   3. Its end time is a guess. Callers render `tripEndFrom(pickup, null)` and must
 *      label the block as awaiting a response, so a guessed bar is never mistaken
 *      for a committed window.
 *
 * Admin client with an explicit vendor_id filter, not RLS. Verified against the live
 * database: `bookings` and `business_bookings` have no vendor SELECT policy at all,
 * only admin / customer / business-user / service_role. The migrations that were
 * meant to add one were never applied. Every vendor-facing booking read in this
 * codebase goes through the admin client for that reason.
 */
export async function getVendorPendingAssignments(
  vendorId: string,
  startDate?: Date,
  endDate?: Date
): Promise<PastBookingAssignment[]> {
  const adminClient = createAdminClient()

  // Never look back past today. `getVendorPastBookings` already returns every
  // status including pending for pickups before today, so this floor is what
  // keeps a single assignment from rendering twice.
  const today = startOfBookingDayUtc()
  const lowerBound = startDate && startDate > today ? startDate : today

  if (endDate && endDate < lowerBound) return []

  // pickup_datetime lives in bookings OR business_bookings, and PostgREST can only
  // range-filter a joined column through an inner join. One query can inner-join one
  // source, so two run and are unioned. Same shape as getVendorPastBookings.
  const customerSelect = `
    id,
    status,
    estimated_duration_hours,
    booking:bookings!inner(
      booking_number,
      trip_number,
      pickup_address,
      dropoff_address,
      pickup_datetime,
      customer:profiles(full_name, phone)
    ),
    vehicle:vehicles(id, make, model, registration_number),
    driver:vendor_drivers(id, first_name, last_name, phone)
  `

  const businessSelect = `
    id,
    status,
    estimated_duration_hours,
    business_booking:business_bookings!inner(
      booking_number,
      trip_number,
      pickup_address,
      dropoff_address,
      pickup_datetime,
      customer_name,
      customer_phone,
      from_location:locations!from_location_id(name),
      to_location:locations!to_location_id(name)
    ),
    vehicle:vehicles(id, make, model, registration_number),
    driver:vendor_drivers(id, first_name, last_name, phone)
  `

  const buildQuery = (select: string, column: string) => {
    let query = adminClient
      .from('booking_assignments')
      .select(select)
      .eq('vendor_id', vendorId)
      .eq('status', 'pending')
      .gte(column, lowerBound.toISOString())

    if (endDate) {
      query = query.lte(column, endDate.toISOString())
    }

    return query
  }

  const [customerResult, businessResult] = await Promise.all([
    buildQuery(customerSelect, 'booking.pickup_datetime'),
    buildQuery(businessSelect, 'business_booking.pickup_datetime'),
  ])

  if (customerResult.error) {
    console.error('Error fetching pending customer assignments:', customerResult.error)
    throw new Error('Failed to fetch pending bookings')
  }

  if (businessResult.error) {
    console.error('Error fetching pending business assignments:', businessResult.error)
    throw new Error('Failed to fetch pending bookings')
  }

  // Boundary cast: PostgREST types embedded relations loosely; the select shape
  // matches PastBookingAssignment by construction.
  const rows = [
    ...(customerResult.data ?? []),
    ...(businessResult.data ?? []),
  ] as unknown as PastBookingAssignment[]

  const seen = new Set<string>()
  const pending: PastBookingAssignment[] = []

  for (const row of rows) {
    if (seen.has(row.id)) continue
    if (!row.booking?.pickup_datetime && !row.business_booking?.pickup_datetime) continue
    seen.add(row.id)
    pending.push(row)
  }

  return pending
}
