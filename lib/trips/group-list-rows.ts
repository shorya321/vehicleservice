/**
 * Collapse the journeys of a round trip or multi-city trip into one list row.
 *
 * A trip is stored as one `bookings` row per journey under a shared
 * `booking_group_id`. Admin lists want one row per order, so the journeys that
 * matched the query are folded into the earliest one, which carries them all in
 * `trip_legs` (travel order). Rows without a group are returned as they are,
 * and the grouped row sits where its first journey sat in the input order.
 */
export interface GroupableRow {
  id: string
  booking_group_id?: string | null
  leg_index?: number | null
}

export type GroupedRow<T> = T & { trip_legs?: T[] }

export function groupTripRows<T extends GroupableRow>(rows: T[]): GroupedRow<T>[] {
  const legsByGroup = new Map<string, T[]>()
  for (const r of rows) {
    if (!r.booking_group_id) continue
    legsByGroup.set(r.booking_group_id, [...(legsByGroup.get(r.booking_group_id) ?? []), r])
  }

  const emitted = new Set<string>()
  const out: GroupedRow<T>[] = []
  for (const r of rows) {
    const groupId = r.booking_group_id
    if (!groupId) {
      out.push(r)
      continue
    }
    if (emitted.has(groupId)) continue
    emitted.add(groupId)
    const legs = [...(legsByGroup.get(groupId) ?? [r])].sort(
      (a, b) => (a.leg_index ?? 0) - (b.leg_index ?? 0)
    )
    out.push({ ...legs[0], trip_legs: legs })
  }
  return out
}
