import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * The admin client as the routes actually build it: `createClient(url, key)`
 * with no Database generic. Named rather than inlined so the three call sites
 * do not each need a cast.
 */
type AdminClient = SupabaseClient

/**
 * Assignment states that mean a vendor is currently on the job.
 *
 * 'rejected', 'cancelled' and 'completed' are all closed: a booking whose only
 * assignment was rejected is back to having nobody on it, and must stay as
 * editable as one that was never assigned.
 */
export const ACTIVE_ASSIGNMENT_STATUSES = ['pending', 'accepted'] as const

/**
 * Which of these bookings currently have a vendor on them.
 *
 * SCOPE: Business module.
 *
 * One implementation rather than a copy per route, because the question is
 * asked from three places now (cancel, delete, bulk delete) and the wrong answer
 * is expensive in both directions: a false negative lets a business delete a
 * booking a driver is on their way to, and a false positive locks them out of
 * their own booking.
 *
 * It deliberately cannot be asked of `booking_status`. That column is never set
 * to 'assigned' anywhere in the product - the fulfilment lifecycle lives in
 * `booking_assignments.status` - so a booking a vendor has accepted still reads
 * 'confirmed'. Every guard written against the status matched nothing.
 *
 * Callers must treat `error` as "assume assigned" and refuse. An unreadable
 * assignments table is not a reason to let a destructive action through.
 */
export async function findBookingsWithActiveAssignment(
  admin: AdminClient,
  bookingIds: readonly string[]
): Promise<{ assignedIds: Set<string>; error: string | null }> {
  if (bookingIds.length === 0) {
    return { assignedIds: new Set(), error: null }
  }

  const { data, error } = await admin
    .from('booking_assignments')
    .select('business_booking_id')
    .in('business_booking_id', bookingIds as string[])
    .in('status', ACTIVE_ASSIGNMENT_STATUSES as unknown as string[])

  if (error) {
    console.error('Failed to read booking assignments:', error)
    return { assignedIds: new Set(), error: error.message }
  }

  const assignedIds = new Set<string>()

  for (const row of data ?? []) {
    const id = (row as { business_booking_id: string | null }).business_booking_id
    if (id) assignedIds.add(id)
  }

  return { assignedIds, error: null }
}

/** The single-booking case, which is what two of the three callers want. */
export async function hasActiveVendorAssignment(
  admin: AdminClient,
  bookingId: string
): Promise<{ assigned: boolean; error: string | null }> {
  const { assignedIds, error } = await findBookingsWithActiveAssignment(admin, [bookingId])

  return { assigned: assignedIds.has(bookingId), error }
}
