import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Moves guest bookings made with this customer's email into their account. The database
 * function only acts once the profile is a verified customer, so an unverified address can
 * never claim someone else's trips. Idempotent and safe to call on every account visit.
 * Never throws: a failure only means the bookings attach on the next visit.
 */
export async function linkGuestBookings(userId: string): Promise<number> {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.rpc('link_guest_bookings', { p_user_id: userId })
    if (error) {
      console.error('[link-guest-bookings] failed:', { userId, error: error.message })
      return 0
    }
    return data ?? 0
  } catch (error) {
    console.error('[link-guest-bookings] failed:', { userId, error: error instanceof Error ? error.message : error })
    return 0
  }
}
