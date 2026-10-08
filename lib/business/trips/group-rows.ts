/**
 * Folds the journeys of a round trip or multi-city trip into one list entry.
 * SCOPE: Business module ONLY. Business twin of lib/trips/group-list-rows.ts. Do not de-duplicate.
 *
 * Rows without a group come back untouched. A grouped entry sits where its first journey sat in
 * the input order and carries every journey in travel order in `trip_legs`.
 */
export interface BusinessGroupableRow {
  id: string;
  booking_group_id?: string | null;
  leg_index?: number | null;
}

export type BusinessGroupedRow<T> = T & { trip_legs?: T[] };

export function groupBusinessTripRows<T extends BusinessGroupableRow>(rows: T[]): BusinessGroupedRow<T>[] {
  const legsByGroup = new Map<string, T[]>();
  for (const row of rows) {
    if (!row.booking_group_id) continue;
    legsByGroup.set(row.booking_group_id, [...(legsByGroup.get(row.booking_group_id) ?? []), row]);
  }

  const emitted = new Set<string>();
  const out: BusinessGroupedRow<T>[] = [];
  for (const row of rows) {
    const groupId = row.booking_group_id;
    if (!groupId) {
      out.push(row);
      continue;
    }
    if (emitted.has(groupId)) continue;
    emitted.add(groupId);
    const legs = [...(legsByGroup.get(groupId) ?? [row])].sort(
      (a, b) => (a.leg_index ?? 0) - (b.leg_index ?? 0)
    );
    out.push({ ...legs[0], trip_legs: legs });
  }
  return out;
}

/**
 * Expands a set of booking ids to every journey of the trips they belong to, so an action on one
 * journey of a trip (delete) covers the whole trip.
 */
export function expandToWholeTrips<T extends BusinessGroupableRow>(selectedIds: string[], rows: T[]): string[] {
  const selected = new Set(selectedIds);
  const groups = new Set(
    rows.filter((row) => selected.has(row.id) && row.booking_group_id).map((row) => row.booking_group_id as string)
  );
  const out = new Set(selectedIds);
  for (const row of rows) {
    if (row.booking_group_id && groups.has(row.booking_group_id)) out.add(row.id);
  }
  return Array.from(out);
}
