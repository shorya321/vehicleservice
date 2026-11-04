'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAction } from '@/lib/auth/admin-action'
import { createAdminClient } from '@/lib/supabase/admin'
import { bookingAutomationSchema } from '@/lib/bookings/automation-schema'

const SETTINGS_PATH = '/admin/settings/booking-automation'

export async function updateBookingAutomation(values: unknown): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdminAction()
  if ('error' in auth) return { success: false, error: auth.error }

  const parsed = bookingAutomationSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Check the values and try again.' }
  }

  const client = createAdminClient()
  const { data: row, error: readError } = await client
    .from('booking_automation_settings')
    .select('id')
    .limit(1)
    .maybeSingle()
  if (readError || !row) {
    console.error('[booking-automation] settings row missing:', readError?.message)
    return { success: false, error: 'Settings could not be loaded. Try again.' }
  }

  const { error } = await client
    .from('booking_automation_settings')
    .update({
      expire_unpaid_enabled: parsed.data.enabled,
      expire_unpaid_minutes: parsed.data.minutes,
      updated_by: auth.userId,
    })
    .eq('id', row.id)
  if (error) {
    console.error('[booking-automation] save failed:', error.message)
    return { success: false, error: 'Settings could not be saved. Try again.' }
  }

  revalidatePath(SETTINGS_PATH)
  return { success: true }
}

/** Expire unpaid checkouts now, even while the automatic job is switched off. */
export async function runUnpaidExpiryNow(): Promise<{ success: boolean; expired?: number; error?: string }> {
  const auth = await requireAdminAction()
  if ('error' in auth) return { success: false, error: auth.error }

  const { data, error } = await createAdminClient().rpc('expire_unpaid_bookings', { p_force: true })
  if (error) {
    console.error('[booking-automation] run now failed:', error.message)
    return { success: false, error: 'The job could not run. Try again.' }
  }

  revalidatePath(SETTINGS_PATH)
  revalidatePath('/admin/bookings')
  return { success: true, expired: data ?? 0 }
}
