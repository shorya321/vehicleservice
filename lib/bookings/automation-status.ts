import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { normaliseUnpaidExpiry } from './unpaid-expiry'

export interface BookingAutomationStatus {
  enabled: boolean
  minutes: number
  lastRunAt: string | null
  lastRunExpired: number | null
  /** The database schedule, or null when it is not installed. */
  schedule: { cron: string; active: boolean } | null
  /** Customer checkouts waiting for payment right now. */
  awaitingPayment: number
  error: string | null
}

/** Everything the Booking automation settings page shows. Admin client, read only. */
export async function getBookingAutomationStatus(): Promise<BookingAutomationStatus> {
  const client = createAdminClient()

  const [settings, job, awaiting] = await Promise.all([
    client
      .from('booking_automation_settings')
      .select('expire_unpaid_enabled, expire_unpaid_minutes, last_run_at, last_run_expired')
      .limit(1)
      .maybeSingle(),
    client.rpc('get_unpaid_expiry_job'),
    client
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_status', 'pending')
      .eq('payment_status', 'processing'),
  ])

  const errors = [settings.error, job.error, awaiting.error].filter(Boolean)
  for (const error of errors) {
    console.error('[booking-automation] status read failed:', error?.message)
  }

  const normalised = normaliseUnpaidExpiry(settings.data)
  const jobRow = Array.isArray(job.data) ? job.data[0] : null

  return {
    enabled: normalised.enabled,
    minutes: normalised.minutes,
    lastRunAt: settings.data?.last_run_at ?? null,
    lastRunExpired: settings.data?.last_run_expired ?? null,
    schedule: jobRow ? { cron: jobRow.schedule, active: jobRow.active } : null,
    awaitingPayment: awaiting.count ?? 0,
    error: errors.length > 0 ? 'Some details could not be loaded.' : null,
  }
}
