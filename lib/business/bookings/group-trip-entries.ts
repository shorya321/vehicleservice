/**
 * Folds the journeys of a round trip or multi-city trip into one list entry.
 *
 * Runs after groupQuotationBookings. Trips are never converted from quotations, so a journey is
 * always a `single` entry going in. The trip entry takes the place of its first journey, so the
 * list keeps its order, and a trip never splits across two pages.
 *
 * SCOPE: Business module ONLY
 */
import type { BookingListEntry } from './group-quotation-bookings';

/** A list entry: a single booking, a quotation's bookings, or a trip's journeys. */
export type BusinessListEntry<T> =
  | BookingListEntry<T & { id: string; pickup_datetime: string }>
  | {
      kind: 'trip';
      groupId: string;
      groupNumber: string | null;
      tripType: string;
      /** The journeys visible after search and filter, in travel order. */
      bookings: T[];
      /** Every journey of the trip. */
      legCount: number;
    };

interface TripGroupableBooking {
  id: string;
  pickup_datetime: string;
  trip_type?: string | null;
  booking_group_id?: string | null;
  leg_index?: number | null;
  booking_group?: { group_number: string | null; leg_count: number | null } | null;
}

export function groupTripEntries<T extends TripGroupableBooking>(
  entries: readonly BookingListEntry<T>[]
): BusinessListEntry<T>[] {
  const legsByGroup = new Map<string, T[]>();
  for (const entry of entries) {
    if (entry.kind !== 'single' || !entry.booking.booking_group_id) continue;
    const id = entry.booking.booking_group_id;
    legsByGroup.set(id, [...(legsByGroup.get(id) ?? []), entry.booking]);
  }

  const emitted = new Set<string>();
  const out: BusinessListEntry<T>[] = [];
  for (const entry of entries) {
    const groupId = entry.kind === 'single' ? entry.booking.booking_group_id : null;
    if (entry.kind !== 'single' || !groupId) {
      out.push(entry);
      continue;
    }
    if (emitted.has(groupId)) continue;
    emitted.add(groupId);

    const legs = [...(legsByGroup.get(groupId) ?? [entry.booking])].sort(
      (a, b) => (a.leg_index ?? 0) - (b.leg_index ?? 0)
    );
    out.push({
      kind: 'trip',
      groupId,
      groupNumber: entry.booking.booking_group?.group_number ?? null,
      tripType: entry.booking.trip_type ?? 'round_trip',
      bookings: legs,
      legCount: entry.booking.booking_group?.leg_count ?? legs.length,
    });
  }
  return out;
}

/** Search hits on one journey bring the rest of its trip along, so a trip never shows partly. */
export function withWholeTrips<T extends { id: string; booking_group_id?: string | null }>(
  all: readonly T[],
  matched: readonly T[]
): T[] {
  const groups = new Set(matched.map((b) => b.booking_group_id).filter((id): id is string => Boolean(id)));
  if (groups.size === 0) return [...matched];
  const matchedIds = new Set(matched.map((b) => b.id));
  return all.filter((b) => matchedIds.has(b.id) || (b.booking_group_id ? groups.has(b.booking_group_id) : false));
}

/** Every booking held by a set of entries, in display order. */
export function flattenListEntries<T>(entries: readonly BusinessListEntry<T>[]): T[] {
  return entries.flatMap((e) => (e.kind === 'single' ? [e.booking as T] : (e.bookings as T[])));
}
