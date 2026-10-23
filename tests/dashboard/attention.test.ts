import {
  ATTENTION_ORDER,
  buildAttentionItems,
  classifyUpcomingBookings,
  emptyAttentionCounts,
  type AttentionCounts,
} from '@/lib/dashboard/attention'

const counts = (overrides: Partial<AttentionCounts> = {}): AttentionCounts => ({
  ...emptyAttentionCounts(),
  ...overrides,
})

describe('classifyUpcomingBookings', () => {
  it('counts a booking with no assignment row as unassigned', () => {
    expect(classifyUpcomingBookings([{ booking_assignments: [] }])).toEqual({
      unassigned: 1,
      rejected: 0,
      awaitingVendor: 0,
    })
  })

  it('treats a null assignment list as unassigned', () => {
    expect(classifyUpcomingBookings([{ booking_assignments: null }]).unassigned).toBe(1)
  })

  it('counts a booking whose only assignment was rejected as rejected, not unassigned', () => {
    expect(
      classifyUpcomingBookings([{ booking_assignments: [{ status: 'rejected' }] }])
    ).toEqual({ unassigned: 0, rejected: 1, awaitingVendor: 0 })
  })

  it('ignores an old rejection once the booking has been reassigned', () => {
    expect(
      classifyUpcomingBookings([
        { booking_assignments: [{ status: 'rejected' }, { status: 'accepted' }] },
      ])
    ).toEqual({ unassigned: 0, rejected: 0, awaitingVendor: 0 })
  })

  it('counts a pending assignment as awaiting the vendor', () => {
    expect(
      classifyUpcomingBookings([
        { booking_assignments: [{ status: 'rejected' }, { status: 'pending' }] },
      ])
    ).toEqual({ unassigned: 0, rejected: 0, awaitingVendor: 1 })
  })

  it('needs nothing for accepted or completed assignments', () => {
    expect(
      classifyUpcomingBookings([
        { booking_assignments: [{ status: 'accepted' }] },
        { booking_assignments: [{ status: 'completed' }] },
      ])
    ).toEqual({ unassigned: 0, rejected: 0, awaitingVendor: 0 })
  })
})

describe('buildAttentionItems', () => {
  it('returns nothing when every queue is empty', () => {
    expect(buildAttentionItems(emptyAttentionCounts())).toEqual([])
  })

  it('hides queues with a zero count', () => {
    const items = buildAttentionItems(counts({ contactMessages: 3 }))
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      key: 'contactMessages',
      count: 3,
      href: '/admin/contact?status=new',
    })
  })

  it('keeps the fixed order, urgent queues first', () => {
    const all = counts({
      unassigned: 1,
      rejected: 1,
      awaitingVendor: 1,
      refundsDue: 1,
      vendorApplications: 1,
      businessApprovals: 1,
      reviews: 1,
      contactMessages: 1,
    })
    expect(buildAttentionItems(all).map((item) => item.key)).toEqual(ATTENTION_ORDER)
  })

  it('links each queue to an existing admin list filter', () => {
    const all = counts({
      unassigned: 1,
      rejected: 1,
      awaitingVendor: 1,
      refundsDue: 1,
      vendorApplications: 1,
      businessApprovals: 1,
      reviews: 1,
      contactMessages: 1,
    })
    const hrefs = Object.fromEntries(buildAttentionItems(all).map((item) => [item.key, item.href]))
    expect(hrefs).toEqual({
      unassigned: '/admin/bookings?timeframe=upcoming',
      rejected: '/admin/bookings?timeframe=upcoming',
      awaitingVendor: '/admin/bookings?timeframe=upcoming',
      refundsDue: '/admin/bookings?status=cancelled',
      vendorApplications: '/admin/vendor-applications?status=pending',
      businessApprovals: '/admin/businesses?status=pending',
      reviews: '/admin/reviews?status=pending',
      contactMessages: '/admin/contact?status=new',
    })
  })

  it('puts the refund total in the refunds description', () => {
    const [item] = buildAttentionItems(counts({ refundsDue: 2, refundsDueAmount: 340 }))
    expect(item.description).toContain('340 AED')
  })

  it('marks unassigned and rejected as urgent', () => {
    const items = buildAttentionItems(counts({ unassigned: 1, rejected: 1, reviews: 1 }))
    expect(items.map((item) => item.tone)).toEqual(['urgent', 'urgent', 'review'])
  })
})
