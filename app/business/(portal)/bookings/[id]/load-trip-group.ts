import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TripGroupSummary, TripJourneyRow } from './components/trip-journeys-card';

/**
 * A trip's group row and all its journeys, for the booking detail page.
 * SCOPE: Business module ONLY.
 *
 * Read with the admin client so a staff member viewing their own journey still sees the trip it
 * belongs to; the account filter keeps it to the caller's tenant.
 */
export async function loadBusinessTripGroup(
  supabase: SupabaseClient,
  groupId: string,
  businessAccountId: string
): Promise<{ group: TripGroupSummary; journeys: TripJourneyRow[] } | null> {
  const [{ data: group, error: groupError }, { data: legs, error: legsError }] = await Promise.all([
    supabase
      .from('business_booking_groups')
      .select('group_number, trip_type, leg_count, subtotal, discount_amount, total_price')
      .eq('id', groupId)
      .eq('business_account_id', businessAccountId)
      .maybeSingle(),
    supabase
      .from('business_bookings')
      .select(`
        id, leg_index, trip_number, booking_number, booking_status, pickup_datetime, total_price,
        from_location:locations!business_bookings_from_location_id_fkey(name),
        to_location:locations!business_bookings_to_location_id_fkey(name)
      `)
      .eq('booking_group_id', groupId)
      .eq('business_account_id', businessAccountId)
      .order('leg_index', { ascending: true }),
  ]);

  if (groupError || legsError || !group) {
    if (groupError || legsError) console.error('Failed to load trip group:', groupError ?? legsError);
    return null;
  }

  const name = (embed: unknown): string | null => {
    const row = Array.isArray(embed) ? embed[0] : embed;
    return (row as { name?: string } | null)?.name ?? null;
  };

  return {
    group: {
      group_number: group.group_number,
      trip_type: group.trip_type,
      leg_count: Number(group.leg_count),
      subtotal: Number(group.subtotal),
      discount_amount: Number(group.discount_amount),
      total_price: Number(group.total_price),
    },
    journeys: (legs ?? []).map((leg) => ({
      id: leg.id,
      leg_index: leg.leg_index,
      trip_number: leg.trip_number,
      booking_number: leg.booking_number,
      booking_status: leg.booking_status,
      pickup_datetime: leg.pickup_datetime,
      total_price: Number(leg.total_price),
      from_name: name(leg.from_location),
      to_name: name(leg.to_location),
    })),
  };
}
