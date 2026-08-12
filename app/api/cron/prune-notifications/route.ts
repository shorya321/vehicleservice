/**
 * CRON Endpoint - Prune the notifications feed
 *
 * notifications had no delete path of any kind until this job existed. Roughly twenty
 * triggers write into it, and create_admin_notification fans a single event out to
 * every verified admin, so the table only ever grew.
 *
 * Three limits in one pass, all applied by prune_notifications. Read rows go at 90
 * days because they have served their purpose. Unread rows get a longer grace at 180,
 * so nothing still actionable disappears early. The per-user cap is the backstop for
 * one account that receives far more than the rest inside the retention window.
 *
 * Schedule: daily at 04:00 UTC (configured in vercel.json), offset from the
 * exchange-rate and email-log jobs so the three are not competing for the same
 * instance.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DEFAULT_READ_RETENTION_DAYS = 90;
const DEFAULT_UNREAD_RETENTION_DAYS = 180;
const DEFAULT_MAX_ROWS_PER_USER = 500;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // Fails closed, and deliberately without the x-vercel-cron fallback the sibling cron
  // routes carry. This repo deploys to two places: Vercel, where that header is
  // platform-controlled, and Coolify, where nothing strips it. Accepting it would let
  // anyone spoof the header against the Coolify domain and drive the retention days
  // down to the SQL function's floors.
  if (!cronSecret) {
    console.error('[CRON prune-notifications] CRON_SECRET is not configured, refusing to run');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);

    // Overridable for a manual run with a deliberately different window. The SQL
    // function clamps all three to sane floors, so a mistyped 0 cannot wipe the table.
    const readRetentionDays =
      Number(url.searchParams.get('read_retention_days')) || DEFAULT_READ_RETENTION_DAYS;
    const unreadRetentionDays =
      Number(url.searchParams.get('unread_retention_days')) || DEFAULT_UNREAD_RETENTION_DAYS;
    const maxRows = Number(url.searchParams.get('max_rows')) || DEFAULT_MAX_ROWS_PER_USER;

    const admin = createAdminClient();

    const { data, error } = await admin.rpc('prune_notifications', {
      p_read_retention_days: readRetentionDays,
      p_unread_retention_days: unreadRetentionDays,
      p_max_rows_per_user: maxRows,
    });

    if (error) {
      console.error('[CRON prune-notifications] failed:', error.message);
      return NextResponse.json({ error: 'Prune failed' }, { status: 500 });
    }

    console.log(`[CRON prune-notifications] removed ${data ?? 0} rows`);

    return NextResponse.json({
      success: true,
      removed: data ?? 0,
      readRetentionDays,
      unreadRetentionDays,
      maxRowsPerUser: maxRows,
    });
  } catch (error) {
    console.error('[CRON prune-notifications] unexpected error:', error);
    return NextResponse.json({ error: 'Prune failed' }, { status: 500 });
  }
}
