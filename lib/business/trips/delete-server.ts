import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Journeys of a trip are deleted together: a round trip with only its return left, or a
 * multi-city trip with a hole in it, is not something the business can act on.
 * SCOPE: Business module ONLY.
 */

/** The requested ids plus every other journey of any trip they belong to, within the account. */
export async function expandToWholeBusinessTrips(
  supabase: SupabaseClient,
  ids: string[],
  businessAccountId: string
): Promise<{ ids: string[]; groupIds: string[]; error: boolean }> {
  const { data: rows, error } = await supabase
    .from('business_bookings')
    .select('booking_group_id')
    .in('id', ids)
    .eq('business_account_id', businessAccountId)
    .not('booking_group_id', 'is', null);
  if (error) return { ids, groupIds: [], error: true };

  const groupIds = Array.from(new Set((rows ?? []).map((r) => r.booking_group_id as string)));
  if (groupIds.length === 0) return { ids, groupIds, error: false };

  const { data: legs, error: legsError } = await supabase
    .from('business_bookings')
    .select('id')
    .in('booking_group_id', groupIds)
    .eq('business_account_id', businessAccountId);
  if (legsError) return { ids, groupIds, error: true };

  return { ids: Array.from(new Set([...ids, ...(legs ?? []).map((l) => l.id as string)])), groupIds, error: false };
}

/** Removes trip rows whose journeys are all gone. Best effort: an orphan group is harmless. */
export async function pruneEmptyBusinessTrips(supabase: SupabaseClient, groupIds: string[]): Promise<void> {
  if (groupIds.length === 0) return;
  const { data: remaining } = await supabase
    .from('business_bookings')
    .select('booking_group_id')
    .in('booking_group_id', groupIds);
  const stillUsed = new Set((remaining ?? []).map((r) => r.booking_group_id as string));
  const empty = groupIds.filter((id) => !stillUsed.has(id));
  if (empty.length === 0) return;
  const { error } = await supabase.from('business_booking_groups').delete().in('id', empty);
  if (error) console.error('Failed to remove empty business trips:', error);
}

/** How many journeys the trip of a booking has, or 1 for a booking outside any trip. */
export async function businessTripJourneyCount(supabase: SupabaseClient, groupId: string | null): Promise<number> {
  if (!groupId) return 1;
  const { count } = await supabase
    .from('business_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('booking_group_id', groupId);
  return count ?? 1;
}
