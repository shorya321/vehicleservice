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

/**
 * PostgREST parses `or=(...)` as an expression, so a search term is not just a value: a
 * comma starts a new condition, parentheses group, and a dot separates column from
 * operator. Interpolating a raw term let a crafted `q` rewrite the filter.
 *
 * Owner RLS and the preceding `.eq(business_account_id)` mean this was never a
 * cross-tenant read, but a search box should not be able to reshape its own query.
 *
 * Backslash-escaping is not available inside an `or()` group, so the separators are
 * stripped rather than escaped. `%` and `_` go too: they are ilike wildcards, and a term
 * of `%` matching every row is not what the box promises. Nothing removed here is
 * meaningful in an email address or a subject search.
 */
function sanitiseSearchTerm(term: string): string {
  return term.replace(/[,().*%_\\"']/g, ' ').replace(/\s+/g, ' ').trim();
}

/** business_email_log.id is a uuid, so a cursor half that is not one did not come from us. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    const safeSearch = search ? sanitiseSearchTerm(search) : '';
    if (safeSearch) {
      query = query.or(`to_email.ilike.%${safeSearch}%,subject.ilike.%${safeSearch}%`);
    }

    // Keyset pagination on (created_at, id): stable while new rows arrive at the head,
    // which an offset would not be.
    //
    // Both halves are interpolated into an or() expression and both come from the query
    // string, so both are shape-checked first. A cursor is something we minted, not
    // something a caller composes, and anything that does not look like one is ignored
    // rather than passed through.
    if (cursor) {
      const [createdAt, id] = cursor.split('|');
      const validTimestamp = createdAt && /^[\d:.T+-]+Z?$/.test(createdAt);
      const validId = id && UUID_PATTERN.test(id);

      if (validTimestamp && validId) {
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
