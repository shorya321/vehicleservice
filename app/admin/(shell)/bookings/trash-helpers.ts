import 'server-only'

import type { createAdminClient } from '@/lib/supabase/admin'
import { businessDeleteBlockedReason } from '@/lib/business/booking-guards'

type AdminClient = ReturnType<typeof createAdminClient>
type TrashSource = 'customer' | 'business'

/**
 * Which customer bookings deleting `bookingId` removes, or why it may not.
 *
 * Same rule as business bookings: a journey takes its whole trip with it, and every journey
 * must be cancelled, completed or past. Deleting never refunds, so a live paid booking has to
 * be cancelled (and its refund recorded) first.
 */
export async function planCustomerDelete(
  adminClient: AdminClient,
  bookingId: string
): Promise<{ ids: string[] } | { error: string }> {
  const { data: booking, error } = await adminClient
    .from('bookings')
    .select('id, booking_group_id')
    .eq('id', bookingId)
    .maybeSingle()
  if (error) return { error: 'Failed to load the booking' }
  if (!booking) return { error: 'Booking not found or already deleted' }

  const columns = 'id, booking_number, booking_status, pickup_datetime'
  const { data: rows, error: rowsError } = booking.booking_group_id
    ? await adminClient.from('bookings').select(columns).eq('booking_group_id', booking.booking_group_id)
    : await adminClient.from('bookings').select(columns).eq('id', bookingId)
  if (rowsError || !rows || rows.length === 0) return { error: 'Failed to load the rest of this trip' }

  for (const row of rows) {
    const blocked = businessDeleteBlockedReason(row)
    if (blocked) return { error: rows.length > 1 ? `${row.booking_number}: ${blocked}` : blocked }
  }

  return { ids: rows.map((row) => row.id) }
}

/**
 * Moves one whole trip to the trash. The RPC snapshots the rows, unlinks any quotation line
 * and deletes, all in one transaction, so a failure leaves the trip exactly as it was.
 * Assignment schedules go with the assignments through the FK cascade.
 */
export async function moveTripToTrash(
  adminClient: AdminClient,
  { ids, source, actorId }: { ids: string[]; source: TrashSource; actorId: string }
): Promise<{ trashId: string } | { error: string }> {
  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name, email')
    .eq('id', actorId)
    .maybeSingle()

  const args = {
    p_booking_ids: ids,
    p_actor_auth_id: actorId,
    p_actor_name: profile?.full_name || profile?.email || 'Platform admin',
    p_actor_role: 'admin',
  }
  const { data, error } = source === 'customer'
    ? await adminClient.rpc('trash_customer_trip', args)
    : await adminClient.rpc('trash_business_trip', args)

  if (error || !data) {
    console.error('Failed to move trip to the trash:', { ids, source, error })
    // P0001 is a RAISE from the trash function itself, whose messages are written for people.
    return { error: error?.code === 'P0001' ? error.message : 'Failed to delete booking' }
  }
  return { trashId: data }
}
