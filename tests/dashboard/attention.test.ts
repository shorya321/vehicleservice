import {
  ATTENTION_ORDER,
  buildAttentionItems,
  classifyUpcomingBookings,
  countExpiringVendorDocuments,
  emptyAttentionCounts,
  isExpiringSoon,
  isLowWallet,
  ratesAreStale,
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
      staleRates: 1,
      lowWallets: 1,
      vendorDocuments: 1,
      driverLicences: 1,
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
      staleRates: 1,
      lowWallets: 1,
      vendorDocuments: 1,
      driverLicences: 1,
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
      staleRates: '/admin/settings/currencies',
      lowWallets: '/admin/businesses?status=active',
      vendorDocuments: '/admin/vendor-applications?status=approved',
      driverLicences: '/admin/vendor-applications?status=approved',
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

describe('isExpiringSoon', () => {
  const today = '2026-10-23'

  it('flags a date that has already passed', () => {
    expect(isExpiringSoon('2026-10-01', today)).toBe(true)
  })

  it('flags a date inside the 30-day window, including its last day', () => {
    expect(isExpiringSoon('2026-11-22', today)).toBe(true)
  })

  it('ignores a date past the window', () => {
    expect(isExpiringSoon('2026-11-23', today)).toBe(false)
  })

  it('reads a full timestamp by its calendar day', () => {
    expect(isExpiringSoon('2026-11-22T23:00:00Z', today)).toBe(true)
  })

  it('ignores a missing or unreadable date', () => {
    expect(isExpiringSoon(null, today)).toBe(false)
    expect(isExpiringSoon('', today)).toBe(false)
    expect(isExpiringSoon('not a date', today)).toBe(false)
  })
})

describe('countExpiringVendorDocuments', () => {
  const today = '2026-10-23'

  it('counts a vendor once even when both documents are due', () => {
    expect(
      countExpiringVendorDocuments(
        [{ documents: { trade_license_expiry: '2026-10-01', insurance_expiry: '2026-10-02' } }],
        today
      )
    ).toBe(1)
  })

  it('counts either document', () => {
    expect(
      countExpiringVendorDocuments(
        [
          { documents: { trade_license_expiry: '2027-06-01', insurance_expiry: '2026-11-01' } },
          { documents: { trade_license_expiry: '2026-11-01' } },
          { documents: { trade_license_expiry: '2027-06-01', insurance_expiry: '2027-06-01' } },
        ],
        today
      )
    ).toBe(2)
  })

  it('ignores vendors without a documents object', () => {
    expect(countExpiringVendorDocuments([{ documents: null }, { documents: 'x' }], today)).toBe(0)
  })
})

describe('isLowWallet', () => {
  it('flags a frozen wallet whatever its balance', () => {
    expect(isLowWallet({ wallet_balance: 5000, wallet_frozen_at: '2026-10-01T00:00:00Z', notification_preferences: null })).toBe(true)
  })

  it('uses the account threshold', () => {
    const prefs = { low_balance_alert: { threshold: 500 } }
    expect(isLowWallet({ wallet_balance: 499, wallet_frozen_at: null, notification_preferences: prefs })).toBe(true)
    expect(isLowWallet({ wallet_balance: 500, wallet_frozen_at: null, notification_preferences: prefs })).toBe(false)
  })

  it('falls back to 100 when no threshold is set', () => {
    expect(isLowWallet({ wallet_balance: 99, wallet_frozen_at: null, notification_preferences: {} })).toBe(true)
    expect(isLowWallet({ wallet_balance: 100, wallet_frozen_at: null, notification_preferences: null })).toBe(false)
  })
})

describe('ratesAreStale', () => {
  const now = new Date('2026-10-23T12:00:00Z')

  it('is fresh inside 36 hours', () => {
    expect(ratesAreStale('2026-10-22T06:00:00Z', now)).toBe(false)
  })

  it('is stale past 36 hours', () => {
    expect(ratesAreStale('2026-10-21T23:59:00Z', now)).toBe(true)
  })

  it('is stale when no rate was ever fetched', () => {
    expect(ratesAreStale(null, now)).toBe(true)
  })
})

describe('new attention rows', () => {
  it('links each to the page where it is fixed', () => {
    const items = buildAttentionItems(
      counts({ staleRates: 1, lowWallets: 2, vendorDocuments: 3, driverLicences: 4 })
    )
    expect(items.map((item) => [item.key, item.href])).toEqual([
      ['staleRates', '/admin/settings/currencies'],
      ['lowWallets', '/admin/businesses?status=active'],
      ['vendorDocuments', '/admin/vendor-applications?status=approved'],
      ['driverLicences', '/admin/vendor-applications?status=approved'],
    ])
  })
})
