/**
 * Business Activity Feed API
 *
 * Owner only. RLS is the second gate: this uses the session-bound client, so
 * even if the requireBusinessOwner wrapper were ever removed, the
 * "Business owners read tenant activity" policy still restricts rows to the
 * caller's own account.
 */


import { createClient } from '@/lib/supabase/server';
import { requireBusinessOwner, apiSuccess, apiError } from '@/lib/business/api-utils';
import { mapActivityRow, parseActivityFilters, applyActivityFilters } from './query';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export const GET = requireBusinessOwner(async (request: Request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );

    let query = supabase
      .from('business_activity_logs')
      .select('*')
      .eq('business_account_id', user.businessAccountId);

    query = applyActivityFilters(query, parseActivityFilters(searchParams, user));

    // Keyset pagination. The table is append-only and unbounded, so OFFSET
    // would make Postgres walk and discard at depth, and rows arriving at the
    // head while the owner reads would silently duplicate and skip entries.
    const cursor = searchParams.get('cursor');
    if (cursor) {
      const [cursorCreatedAt, cursorId] = cursor.split('|');
      if (cursorCreatedAt && cursorId) {
        query = query.or(
          `created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`
        );
      }
    }

    // Fetch one extra row to decide hasMore without a COUNT.
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (error) {
      console.error('Failed to load business activity:', error);
      return apiError('Failed to load activity', 500);
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];

    return apiSuccess({
      events: page.map(mapActivityRow),
      nextCursor: hasMore && last ? `${last.created_at}|${last.id}` : null,
      hasMore,
    });
  } catch (error) {
    console.error('Business activity feed error:', error);
    return apiError('Failed to load activity', 500);
  }
});
