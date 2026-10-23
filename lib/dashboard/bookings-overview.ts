/**
 * Pure shaping for the dashboard's Bookings Overview card. Queries live in
 * `bookings-overview-queries.ts`.
 */

export interface SourceTotals {
  monthBookings: number
  allBookings: number
  monthRevenue: number
  allRevenue: number
  monthCancelled: number
}

export interface BookingsOverview {
  customer: SourceTotals
  business: SourceTotals
  total: SourceTotals
  hasMonthBookings: boolean
  /** Whole percentages of this month's bookings; they sum to 100 when there are any. */
  customerShare: number
  businessShare: number
}

export function emptySourceTotals(): SourceTotals {
  return { monthBookings: 0, allBookings: 0, monthRevenue: 0, allRevenue: 0, monthCancelled: 0 }
}

function addTotals(a: SourceTotals, b: SourceTotals): SourceTotals {
  return {
    monthBookings: a.monthBookings + b.monthBookings,
    allBookings: a.allBookings + b.allBookings,
    monthRevenue: a.monthRevenue + b.monthRevenue,
    allRevenue: a.allRevenue + b.allRevenue,
    monthCancelled: a.monthCancelled + b.monthCancelled,
  }
}

export function buildBookingsOverview(customer: SourceTotals, business: SourceTotals): BookingsOverview {
  const total = addTotals(customer, business)
  const hasMonthBookings = total.monthBookings > 0
  // Round one side and derive the other so the bar's two labels always add up.
  const businessShare = hasMonthBookings ? Math.round((business.monthBookings / total.monthBookings) * 100) : 0
  const customerShare = hasMonthBookings ? 100 - businessShare : 0

  return { customer, business, total, hasMonthBookings, customerShare, businessShare }
}
