import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_UNPAID_EXPIRY, normaliseUnpaidExpiry, type UnpaidExpirySettings } from './unpaid-expiry'

/**
 * Current unpaid-expiry settings, read fresh (no cache) so an admin change applies
 * to the very next payment page. Falls back to the defaults if the row cannot be
 * read: the safe direction, because a stale unpaid booking then still closes.
 */
export async function getUnpaidExpirySettings(): Promise<UnpaidExpirySettings> {
  try {
    const { data, error } = await createAdminClient()
      .from('booking_automation_settings')
      .select('expire_unpaid_enabled, expire_unpaid_minutes')
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error('[unpaid-expiry] settings read failed:', error.message)
      return DEFAULT_UNPAID_EXPIRY
    }
    return normaliseUnpaidExpiry(data)
  } catch (error: unknown) {
    console.error('[unpaid-expiry] settings read failed:', error)
    return DEFAULT_UNPAID_EXPIRY
  }
}
