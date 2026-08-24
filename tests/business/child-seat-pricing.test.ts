/**
 * Server-side rules for paid child seats on business bookings.
 *
 * calculateBusinessBookingPrice is the single authority for B2B pricing: the API route, the
 * quotation preflight and the quotation conversion all go through it, and the wallet is debited
 * from the number it returns. These lock the child-seat rules it enforces — one age per seat, ages
 * in range, seats capped at children + infants, and the flag read from the DB rather than the
 * client — because by the time an insert fails, the money has already moved.
 *
 * The Supabase client is a hand-rolled fake: the function takes it as an argument, so no module
 * mocking is needed.
 */

import { calculateBusinessBookingPrice } from '@/lib/business/price-calculation'

const FROM = '11111111-1111-1111-1111-111111111111'
const TO = '22222222-2222-2222-2222-222222222222'
const VEHICLE = '33333333-3333-3333-3333-333333333333'

const SEAT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const OTHER_SEAT = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const WIFI = 'cccccccc-cccc-cccc-cccc-cccccccccccc'

/** Catalogue the fake DB serves. Mirrors the real Child Safety / Comfort rows. */
const ADDON_ROWS = [
  {
    id: SEAT,
    name: 'Infant Car Seat',
    price: 10,
    is_active: true,
    pricing_type: 'per_unit',
    max_quantity: 4,
    requires_child_age: true,
  },
  {
    id: OTHER_SEAT,
    name: 'Booster Seat',
    price: 8,
    is_active: true,
    pricing_type: 'per_unit',
    max_quantity: 4,
    requires_child_age: true,
  },
  {
    id: WIFI,
    name: 'In-Car WiFi',
    price: 8,
    is_active: true,
    pricing_type: 'fixed',
    max_quantity: 1,
    requires_child_age: false,
  },
]

function makeSupabase() {
  return {
    from(table: string) {
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        in: (_col: string, ids: string[]) => {
          if (table === 'locations') {
            return Promise.resolve({
              data: [
                { id: FROM, name: 'A', zone_id: 'zone-a' },
                { id: TO, name: 'B', zone_id: 'zone-b' },
              ],
            })
          }
          if (table === 'addons') {
            return Promise.resolve({ data: ADDON_ROWS.filter((a) => ids.includes(a.id)) })
          }
          return Promise.resolve({ data: [] })
        },
        single: () => {
          if (table === 'zone_pricing') return Promise.resolve({ data: { base_price: 100 } })
          if (table === 'vehicle_types') {
            return Promise.resolve({
              data: {
                business_price_multiplier: 2,
                price_multiplier: 2,
                passenger_capacity: 4,
              },
            })
          }
          return Promise.resolve({ data: null })
        },
      }
      return builder
    },
  } as any
}

const base = {
  fromLocationId: FROM,
  toLocationId: TO,
  vehicleTypeId: VEHICLE,
  passengerCount: 3,
}

describe('calculateBusinessBookingPrice — child seats', () => {
  it('prices a child seat and returns its ages for persistence', async () => {
    const result = await calculateBusinessBookingPrice(makeSupabase(), {
      ...base,
      // One child, one seat. Exactly meets the floor below; previously this read
      // children: 1, infants: 1 with a single seat, which the floor now rejects.
      children: 1,
      infants: 0,
      passengerCount: 2,
      selectedAddons: [{ addon_id: SEAT, quantity: 1, child_ages: [0] }],
    })

    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.basePrice).toBe(200)
    expect(result.addonsPrice).toBe(10)
    expect(result.totalPrice).toBe(210)
    expect(result.verifiedAddons).toEqual([
      expect.objectContaining({ addon_id: SEAT, quantity: 1, child_ages: [0] }),
    ])
  })

  it('rejects a child seat with no ages at all', async () => {
    const result = await calculateBusinessBookingPrice(makeSupabase(), {
      ...base,
      children: 1,
      infants: 1,
      selectedAddons: [{ addon_id: SEAT, quantity: 1 }],
    })
    expect(result).toEqual({ error: 'Infant Car Seat: one child age is required per seat' })
  })

  it('rejects a quantity/ages mismatch — 2 seats but 1 age', async () => {
    const result = await calculateBusinessBookingPrice(makeSupabase(), {
      ...base,
      children: 1,
      infants: 1,
      selectedAddons: [{ addon_id: SEAT, quantity: 2, child_ages: [3] }],
    })
    expect(result).toEqual({ error: 'Infant Car Seat: one child age is required per seat' })
  })

  it.each([[-1], [13], [1.5]])('rejects an out-of-range age (%p)', async (age) => {
    const result = await calculateBusinessBookingPrice(makeSupabase(), {
      ...base,
      children: 1,
      infants: 1,
      selectedAddons: [{ addon_id: SEAT, quantity: 1, child_ages: [age] }],
    })
    expect(result).toEqual({ error: 'Infant Car Seat: child age must be between 0 and 12' })
  })

  it('caps total seats at children + infants, across DIFFERENT addons', async () => {
    // Each addon is individually within its own max_quantity of 4 — only the shared
    // children+infants budget makes this invalid, which is exactly the case a per-addon
    // check would miss.
    const result = await calculateBusinessBookingPrice(makeSupabase(), {
      ...base,
      children: 1,
      infants: 0,
      passengerCount: 2,
      selectedAddons: [
        { addon_id: SEAT, quantity: 1, child_ages: [0] },
        { addon_id: OTHER_SEAT, quantity: 1, child_ages: [6] },
      ],
    })
    expect(result).toEqual({
      error: '2 child seat(s) selected but the booking has 1 child/infant guest(s)',
    })
  })

  it('allows seats up to exactly the capacity', async () => {
    const result = await calculateBusinessBookingPrice(makeSupabase(), {
      ...base,
      children: 1,
      infants: 1,
      selectedAddons: [
        { addon_id: SEAT, quantity: 1, child_ages: [0] },
        { addon_id: OTHER_SEAT, quantity: 1, child_ages: [6] },
      ],
    })
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.addonsPrice).toBe(18)
    expect(result.totalPrice).toBe(218)
  })

  it('refuses to price a child seat when the guest breakdown was not supplied', async () => {
    // Silently skipping the cap for a caller that forgot to pass the breakdown would make the
    // whole guard optional. Every caller that can sell a seat must supply it.
    const result = await calculateBusinessBookingPrice(makeSupabase(), {
      ...base,
      selectedAddons: [{ addon_id: SEAT, quantity: 1, child_ages: [0] }],
    })
    expect(result).toEqual({
      error: 'Guest breakdown (children and infants) is required to book a child seat',
    })
  })

  it('ignores child-age rules for addons that do not require an age', async () => {
    // WiFi must not be dragged into the cap, and must not demand ages.
    const result = await calculateBusinessBookingPrice(makeSupabase(), {
      ...base,
      selectedAddons: [{ addon_id: WIFI, quantity: 1 }],
    })
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.verifiedAddons).toEqual([
      expect.objectContaining({ addon_id: WIFI, child_ages: null }),
    ])
    expect(result.totalPrice).toBe(208)
  })

  it('still enforces the per-addon max_quantity alongside the seat cap', async () => {
    const result = await calculateBusinessBookingPrice(makeSupabase(), {
      ...base,
      children: 9,
      infants: 0,
      passengerCount: 4,
      selectedAddons: [{ addon_id: SEAT, quantity: 5, child_ages: [1, 2, 3, 4, 5] }],
    })
    expect(result).toEqual({ error: 'Infant Car Seat: maximum quantity is 4' })
  })

  it('does not trust a client-supplied requires_child_age', async () => {
    // The flag is not part of the input type at all — it is read from the addons table — so a
    // payload claiming the seat needs no age still has to provide one.
    const result = await calculateBusinessBookingPrice(makeSupabase(), {
      ...base,
      children: 1,
      infants: 0,
      passengerCount: 2,
      selectedAddons: [
        { addon_id: SEAT, quantity: 1, requires_child_age: false } as never,
      ],
    })
    expect(result).toEqual({ error: 'Infant Car Seat: one child age is required per seat' })
  })

  /**
   * The floor. Every case above is a ceiling: they stop a booking carrying MORE seats than it
   * has children. None of them stopped a booking carrying fewer, and a request with no addons
   * at all skipped the addon block entirely, so two infants and zero seats was accepted in
   * silence. That is the bug these lock.
   */
  describe('requires one seat per child and infant', () => {
    it('rejects a booking with children and no addons at all', async () => {
      // The regression case: selectedAddons omitted, so the whole addon block is skipped.
      const result = await calculateBusinessBookingPrice(makeSupabase(), {
        ...base,
        children: 1,
        infants: 1,
        passengerCount: 3,
      })
      expect(result).toEqual({
        error: '2 child/infant guest(s) on this booking but only 0 child seat(s) selected',
      })
    })

    it('rejects a booking with children whose addons are all non-seats', async () => {
      const result = await calculateBusinessBookingPrice(makeSupabase(), {
        ...base,
        children: 0,
        infants: 1,
        passengerCount: 2,
        selectedAddons: [{ addon_id: WIFI, quantity: 1 }],
      })
      expect(result).toEqual({
        error: '1 child/infant guest(s) on this booking but only 0 child seat(s) selected',
      })
    })

    it('rejects a partially seated booking', async () => {
      const result = await calculateBusinessBookingPrice(makeSupabase(), {
        ...base,
        children: 2,
        infants: 1,
        passengerCount: 4,
        selectedAddons: [{ addon_id: SEAT, quantity: 2, child_ages: [0, 3] }],
      })
      expect(result).toEqual({
        error: '3 child/infant guest(s) on this booking but only 2 child seat(s) selected',
      })
    })

    it('accepts a fully seated booking, counting across different seat addons', async () => {
      const result = await calculateBusinessBookingPrice(makeSupabase(), {
        ...base,
        children: 1,
        infants: 1,
        selectedAddons: [
          { addon_id: SEAT, quantity: 1, child_ages: [0] },
          { addon_id: OTHER_SEAT, quantity: 1, child_ages: [6] },
        ],
      })
      expect('error' in result).toBe(false)
    })

    it('leaves a booking with no children or infants alone', async () => {
      // The overwhelming majority of real traffic. Must behave exactly as before.
      const result = await calculateBusinessBookingPrice(makeSupabase(), {
        ...base,
        children: 0,
        infants: 0,
        selectedAddons: [{ addon_id: WIFI, quantity: 1 }],
      })
      expect('error' in result).toBe(false)
      if ('error' in result) return
      expect(result.totalPrice).toBe(208)
    })

    it('skips the floor entirely when the breakdown was not supplied', async () => {
      // A caller that passes no breakdown cannot be measured against one. The existing
      // guard still catches the dangerous half of that (a seat selected with no breakdown).
      const result = await calculateBusinessBookingPrice(makeSupabase(), {
        ...base,
        selectedAddons: [{ addon_id: WIFI, quantity: 1 }],
      })
      expect('error' in result).toBe(false)
    })
  })
})
