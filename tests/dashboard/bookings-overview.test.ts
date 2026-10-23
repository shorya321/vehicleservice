import {
  buildBookingsOverview,
  emptySourceTotals,
  type SourceTotals,
} from '@/lib/dashboard/bookings-overview'

const totals = (overrides: Partial<SourceTotals> = {}): SourceTotals => ({
  ...emptySourceTotals(),
  ...overrides,
})

describe('buildBookingsOverview', () => {
  it('adds customer and business into the total column', () => {
    const overview = buildBookingsOverview(
      totals({ monthBookings: 2, allBookings: 5, monthRevenue: 100, allRevenue: 400, monthCancelled: 1 }),
      totals({ monthBookings: 7, allBookings: 21, monthRevenue: 1586, allRevenue: 4038, monthCancelled: 1 })
    )
    expect(overview.total).toEqual({
      monthBookings: 9,
      allBookings: 26,
      monthRevenue: 1686,
      allRevenue: 4438,
      monthCancelled: 2,
    })
  })

  it('splits this month\'s bookings into whole percentages that sum to 100', () => {
    const overview = buildBookingsOverview(totals({ monthBookings: 1 }), totals({ monthBookings: 2 }))
    expect(overview.customerShare + overview.businessShare).toBe(100)
    expect(overview.customerShare).toBe(33)
    expect(overview.businessShare).toBe(67)
  })

  it('reports all-business as 0 and 100', () => {
    const overview = buildBookingsOverview(totals(), totals({ monthBookings: 7 }))
    expect(overview.customerShare).toBe(0)
    expect(overview.businessShare).toBe(100)
  })

  it('has no share when nothing was booked this month', () => {
    const overview = buildBookingsOverview(totals({ allBookings: 3 }), totals({ allBookings: 4 }))
    expect(overview.hasMonthBookings).toBe(false)
    expect(overview.customerShare).toBe(0)
    expect(overview.businessShare).toBe(0)
  })
})
