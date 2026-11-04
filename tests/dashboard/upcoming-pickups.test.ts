import { customerPickupName, summarizePickups, vendorState, type PickupRow } from '@/lib/dashboard/upcoming-pickups'

const row = (overrides: Partial<PickupRow> = {}): PickupRow => ({
  id: 'b1',
  pickupAt: '2026-10-23T18:30:00Z',
  route: 'DXB → Downtown',
  who: 'Atul Sharma',
  source: 'business',
  assignments: [],
  ...overrides,
})

describe('vendorState', () => {
  it('is none with no assignment', () => {
    expect(vendorState([])).toBe('none')
    expect(vendorState(null)).toBe('none')
  })

  it('is none when the only assignment was rejected or cancelled', () => {
    expect(vendorState([{ status: 'rejected' }, { status: 'cancelled' }])).toBe('none')
  })

  it('is awaiting while the vendor has not answered', () => {
    expect(vendorState([{ status: 'rejected' }, { status: 'pending' }])).toBe('awaiting')
  })

  it('is accepted once a vendor accepts or completes', () => {
    expect(vendorState([{ status: 'accepted' }])).toBe('accepted')
    expect(vendorState([{ status: 'completed' }])).toBe('accepted')
  })
})

describe('summarizePickups', () => {
  it('sorts by pickup time across both booking types', () => {
    const { items } = summarizePickups([
      row({ id: 'late', pickupAt: '2026-10-24T07:00:00Z' }),
      row({ id: 'early', pickupAt: '2026-10-23T16:00:00Z', source: 'customer' }),
    ])
    expect(items.map((item) => item.id)).toEqual(['early', 'late'])
  })

  it('counts every trip and every trip without a vendor, beyond the shown limit', () => {
    const rows = Array.from({ length: 8 }, (_, index) =>
      row({ id: `b${index}`, assignments: index < 3 ? [] : [{ status: 'accepted' }] })
    )
    const summary = summarizePickups(rows, 6)
    expect(summary.items).toHaveLength(6)
    expect(summary.total).toBe(8)
    expect(summary.withoutVendor).toBe(3)
  })

  it('attaches the vendor state to each item', () => {
    const { items } = summarizePickups([row({ assignments: [{ status: 'pending' }] })])
    expect(items[0].vendor).toBe('awaiting')
  })
})

describe('customerPickupName', () => {
  const passenger = (first: string | null, last: string | null, primary: boolean | null) => ({
    first_name: first,
    last_name: last,
    is_primary: primary,
  })

  it('uses the account name when there is one', () => {
    expect(customerPickupName('Atul Sharma', [passenger('Gina', 'Guest', true)], null)).toBe('Atul Sharma')
  })

  it('names a guest by the lead passenger', () => {
    expect(
      customerPickupName(null, [passenger('Second', 'Rider', false), passenger('Gina', 'Guest', true)], 'g@example.com')
    ).toBe('Gina Guest')
  })

  it('falls back to the first passenger when none is marked lead', () => {
    expect(customerPickupName(undefined, [passenger('Omar', null, null)], null)).toBe('Omar')
  })

  it('falls back to the booking email, then Guest', () => {
    expect(customerPickupName('  ', [passenger(null, ' ', true)], 'g@example.com')).toBe('g@example.com')
    expect(customerPickupName(null, null, null)).toBe('Guest')
  })
})
