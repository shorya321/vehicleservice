/**
 * Pure shaping for the dashboard's Upcoming Pickups card. The query lives in
 * `upcoming-pickups-queries.ts`.
 */

export type VendorState = 'accepted' | 'awaiting' | 'none'

export interface PickupRow {
  id: string
  pickupAt: string
  route: string
  who: string
  source: 'customer' | 'business'
  assignments: Array<{ status: string }> | null
}

export interface PickupItem extends Omit<PickupRow, 'assignments'> {
  vendor: VendorState
}

export interface PickupSummary {
  items: PickupItem[]
  total: number
  withoutVendor: number
}

export const PICKUPS_SHOWN = 6

/** Rejected and cancelled assignments are closed, so they leave the trip with no vendor. */
export function vendorState(assignments: Array<{ status: string }> | null): VendorState {
  const statuses = (assignments ?? []).map((a) => a.status)
  if (statuses.some((status) => status === 'accepted' || status === 'completed')) return 'accepted'
  if (statuses.includes('pending')) return 'awaiting'
  return 'none'
}

/** Soonest first. Totals cover every trip in the window, not only the ones shown. */
export function summarizePickups(rows: PickupRow[], limit: number = PICKUPS_SHOWN): PickupSummary {
  const all = rows
    .map(({ assignments, ...rest }) => ({ ...rest, vendor: vendorState(assignments) }))
    .sort((a, b) => new Date(a.pickupAt).getTime() - new Date(b.pickupAt).getTime())

  return {
    items: all.slice(0, limit),
    total: all.length,
    withoutVendor: all.filter((item) => item.vendor === 'none').length,
  }
}
