/**
 * Activity summary strip.
 *
 * Owner only. Respects the same filters as the feed, so the numbers always
 * describe what the owner is currently looking at.
 */


import { createClient } from '@/lib/supabase/server';
import { requireBusinessOwner, apiSuccess, apiError } from '@/lib/business/api-utils';
import { parseActivityFilters, applyActivityFilters } from '../query';

// A summary must not scan an unbounded table. Beyond this the counts are
// reported as "at least N", which is honest rather than silently truncated.
const STATS_SCAN_CAP = 5000;

export const GET = requireBusinessOwner(async (request: Request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    let query = supabase
      .from('business_activity_logs')
      .select('category, severity, amount, actor_name, actor_business_user_id, action')
      .eq('business_account_id', user.businessAccountId);

    query = applyActivityFilters(query, parseActivityFilters(searchParams, user));

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(STATS_SCAN_CAP);

    if (error) {
      console.error('Failed to load activity stats:', error);
      return apiError('Failed to load activity stats', 500);
    }

    const rows = data ?? [];
    const countsByCategory: Record<string, number> = {};
    const actorCounts = new Map<string, { name: string; id: string | null; count: number }>();

    let criticalEvents = 0;
    let moneyIn = 0;
    let moneyOut = 0;

    for (const row of rows) {
      countsByCategory[row.category] = (countsByCategory[row.category] ?? 0) + 1;
      if (row.severity === 'critical') criticalEvents += 1;

      const amount = row.amount === null ? 0 : Number(row.amount);
      if (amount) {
        // Actions that add to the wallet versus actions that take from it.
        // Stored amounts are absolute, so direction comes from the action.
        if (
          row.action === 'wallet.topup_succeeded' ||
          row.action === 'wallet.refunded' ||
          row.action === 'wallet.credited_by_admin'
        ) {
          moneyIn += amount;
        } else if (
          row.action === 'booking.created' ||
          row.action === 'wallet.debited' ||
          row.action === 'wallet.debited_by_admin'
        ) {
          moneyOut += amount;
        }
      }

      // Only real people are counted for "most active": Platform admin, Stripe
      // and System are not team members and would drown out the humans.
      if (row.actor_business_user_id) {
        const key = row.actor_business_user_id;
        const existing = actorCounts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          actorCounts.set(key, { name: row.actor_name, id: key, count: 1 });
        }
      }
    }

    const topActor =
      Array.from(actorCounts.values()).sort((a, b) => b.count - a.count)[0] ?? null;

    return apiSuccess({
      totalEvents: rows.length,
      truncated: rows.length >= STATS_SCAN_CAP,
      criticalEvents,
      moneyIn,
      moneyOut,
      currency: 'AED',
      countsByCategory,
      topActor: topActor
        ? { name: topActor.name, businessUserId: topActor.id, count: topActor.count }
        : null,
    });
  } catch (error) {
    console.error('Activity stats error:', error);
    return apiError('Failed to load activity stats', 500);
  }
});
