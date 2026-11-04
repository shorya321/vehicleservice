import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * Backup trigger for the unpaid-checkout expiry. The job normally runs inside the
 * database (pg_cron, every 5 minutes), so it does not depend on the app host.
 * This route lets any other scheduler (AWS EventBridge or a Coolify task, for example) run
 * the same job if the database ever moves somewhere without pg_cron.
 *
 * Auth is a strict Bearer CRON_SECRET check and fails closed when the secret is
 * unset. No x-vercel-cron fallback: that header is spoofable off Vercel. The job
 * still honours the admin's on/off switch.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[CRON expire-unpaid-bookings] CRON_SECRET is not set; refusing to run')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await createAdminClient().rpc('expire_unpaid_bookings', { p_force: false })
    if (error) {
      console.error('[CRON expire-unpaid-bookings] failed:', error.message)
      return NextResponse.json({ error: 'Expiry failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true, expired: data ?? 0 })
  } catch (error: unknown) {
    console.error('[CRON expire-unpaid-bookings] failed:', error)
    return NextResponse.json({ error: 'Expiry failed' }, { status: 500 })
  }
}
