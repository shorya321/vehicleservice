/**
 * CRON Endpoint - Prune the business email delivery log
 *
 * business_email_log gets one row per email sent on any tenant's behalf, so it grows
 * with booking volume and never stops. This trims it on two axes: an age cutoff, which
 * is the actual retention rule, and a per-tenant row cap, so one high-volume or
 * misbehaving integration cannot crowd out every other tenant's history inside the
 * retention window.
 *
 * Schedule: daily at 03:30 UTC (configured in vercel.json), deliberately offset from the
 * exchange-rate job so the two are not competing for the same instance.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DEFAULT_RETENTION_DAYS = 90;
const DEFAULT_MAX_ROWS_PER_ACCOUNT = 5000;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // Fails closed. The previous shape only checked the header `if (cronSecret)`, so with
  // CRON_SECRET unset the route was open to anyone, and retention_days is a caller-supplied
  // query parameter. An anonymous request could trim every tenant's delivery log to the
  // SQL function's 7-day floor. Missing configuration is not authorisation.
  if (!cronSecret) {
    console.error('[CRON prune-email-logs] CRON_SECRET is not configured, refusing to run');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Bearer only. There used to be a fallback that accepted an `x-vercel-cron: 1`
  // header when the Authorization header did not match. That header is
  // platform-controlled on Vercel but this repo also deploys to Coolify, where nothing
  // strips it, so anyone could send it against the Coolify domain and trim every
  // tenant's delivery log to the 7-day floor. Vercel Cron sends the Authorization
  // header itself whenever CRON_SECRET is set on the project, so the fallback bought
  // nothing.
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);

    // Overridable for a manual dry-ish run with a deliberately large window. The SQL
    // function clamps both to sane floors, so a mistyped 0 cannot wipe the table.
    const retentionDays = Number(url.searchParams.get('retention_days')) || DEFAULT_RETENTION_DAYS;
    const maxRows = Number(url.searchParams.get('max_rows')) || DEFAULT_MAX_ROWS_PER_ACCOUNT;

    const admin = createAdminClient();

    const { data, error } = await admin.rpc('prune_business_email_log', {
      p_retention_days: retentionDays,
      p_max_rows_per_account: maxRows,
    });

    if (error) {
      console.error('[CRON prune-email-logs] failed:', error.message);
      return NextResponse.json({ error: 'Prune failed' }, { status: 500 });
    }

    console.log(`[CRON prune-email-logs] removed ${data ?? 0} rows`);

    return NextResponse.json({
      success: true,
      removed: data ?? 0,
      retentionDays,
      maxRowsPerAccount: maxRows,
    });
  } catch (error) {
    console.error('[CRON prune-email-logs] unexpected error:', error);
    return NextResponse.json({ error: 'Prune failed' }, { status: 500 });
  }
}
