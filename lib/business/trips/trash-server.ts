import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BusinessUserContext } from '@/lib/business/api-utils';
import { quotationTripDeleteBlockedReason } from '@/lib/business/booking-guards';

/**
 * Portal deletes go to the trash: trash_business_trips snapshots each trip, unlinks any
 * quotation line and deletes, in one transaction, so a failure leaves every trip in place.
 * The business owner can restore from Bookings, Trash for 30 days.
 * SCOPE: Business module ONLY.
 */

interface TripJourney {
  id: string;
  booking_group_id: string | null;
  booking_status: string | null;
  trip_number?: string | null;
  booking_number?: string | null;
}

/** A trip is its group, or the booking itself when it has none. */
function tripKey(journey: TripJourney): string {
  return journey.booking_group_id ?? journey.id;
}

/**
 * Names of the quotation trips in `journeys` that may not be deleted yet, i.e. that still have
 * a journey which is not cancelled. A quotation stamps a trip's first journey
 * (converted_booking_id) and the trip itself (converted_group_id), so both are checked.
 */
export async function blockedQuotationTrips(
  supabase: SupabaseClient,
  journeys: TripJourney[]
): Promise<{ blocked: string[]; reason: string | null; error: boolean }> {
  const ids = journeys.map((j) => j.id);
  const groupIds = Array.from(new Set(journeys.map((j) => j.booking_group_id).filter(Boolean))) as string[];

  const checks = [
    supabase.from('business_quotation_items').select('converted_booking_id, converted_group_id').in('converted_booking_id', ids),
    ...(groupIds.length > 0
      ? [supabase.from('business_quotation_items').select('converted_booking_id, converted_group_id').in('converted_group_id', groupIds)]
      : []),
  ];

  const linkedKeys = new Set<string>();
  for (const { data, error } of await Promise.all(checks)) {
    if (error) return { blocked: [], reason: null, error: true };
    for (const link of data ?? []) {
      if (link.converted_group_id) linkedKeys.add(link.converted_group_id);
      if (link.converted_booking_id) {
        const journey = journeys.find((j) => j.id === link.converted_booking_id);
        if (journey) linkedKeys.add(tripKey(journey));
      }
    }
  }

  const blocked: string[] = [];
  let reason: string | null = null;
  for (const key of Array.from(linkedKeys)) {
    const trip = journeys.filter((j) => tripKey(j) === key);
    const tripReason = quotationTripDeleteBlockedReason(trip);
    if (tripReason) {
      reason = tripReason;
      blocked.push(trip[0]?.trip_number || trip[0]?.booking_number || key);
    }
  }
  return { blocked, reason, error: false };
}

/** Moves whole trips to the trash. `ids` must already cover every journey of each trip. */
export async function moveBusinessTripsToTrash(
  supabase: SupabaseClient,
  ids: string[],
  user: BusinessUserContext
): Promise<{ ok: true } | { error: string; status: number }> {
  const { error } = await supabase.rpc('trash_business_trips', {
    p_booking_ids: ids,
    p_actor_auth_id: user.userId,
    p_actor_name: user.memberName || user.memberEmail || user.businessName,
    p_actor_role: user.role,
  });

  if (!error) return { ok: true };

  console.error('Failed to move business trips to the trash:', { ids, error });
  // P0001 is a RAISE from the trash function itself, whose messages are written for people.
  if (error.code === 'P0001') {
    const notFound = error.message.includes('not found');
    return { error: notFound ? 'Booking not found' : error.message, status: notFound ? 404 : 409 };
  }
  return { error: 'Failed to delete booking', status: 500 };
}
