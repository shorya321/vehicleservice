/**
 * Delivery log for a business's outgoing email.
 *
 * Read-only, and deliberately uses the session-bound client rather than the admin one so
 * the owner-only RLS policy is a second gate behind requireBusinessOwner. Being GET-only
 * it is also invisible to the activity-coverage test, which is correct: reading a log is
 * not an activity worth logging.
 */

import { requireBusinessOwner, apiSuccess, apiError } from '@/lib/business/api-utils';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export const GET = requireBusinessOwner(async (request, user) => {
  try {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit')) || DEFAULT_LIMIT, MAX_LIMIT);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('q')?.trim();
    const cursor = url.searchParams.get('cursor');

    const supabase = await createClient();

    let query = supabase
      .from('business_email_log')
      .select(
        'id, kind, to_email, from_email, subject, provider, status, smtp_host, message_id, ' +
          'error_code, error_message, duration_ms, attempt, related_id, created_at'
      )
      .eq('business_account_id', user.businessAccountId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      // One extra row tells us whether another page exists without a second count query.
      .limit(limit + 1);

    if (status && ['sent', 'failed', 'fell_back'].includes(status)) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`to_email.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    // Keyset pagination on (created_at, id): stable while new rows arrive at the head,
    // which an offset would not be.
    if (cursor) {
      const [createdAt, id] = cursor.split('|');
      if (createdAt && id) {
        query = query.or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[business email log] read failed:', error.message);
      return apiError('Failed to load the delivery log', 500);
    }

    // The select string is built from a concatenation, which PostgREST's type inference
    // cannot follow, so it falls back to an error union. The shape is pinned here.
    const rows = (data ?? []) as unknown as Array<{ id: string; created_at: string }>;
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];

    return apiSuccess({
      logs: page,
      hasMore,
      nextCursor: hasMore && last ? `${last.created_at}|${last.id}` : null,
    });
  } catch (error) {
    console.error('[business email log] unexpected error:', error);
    return apiError('Failed to load the delivery log', 500);
  }
});
