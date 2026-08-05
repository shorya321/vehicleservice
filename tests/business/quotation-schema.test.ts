/**
 * Quotation trip validation.
 *
 * The datetime cases exist because of a real bug found in browser testing: PostgREST returns
 * timestamptz as "2026-08-15T04:30:00+00:00", and a bare `z.string().datetime()` accepts only
 * a "Z" suffix. Creating a quotation worked (the client sends toISOString()), but RE-SAVING one
 * that already had a dated trip failed with "Invalid datetime format", so editing a saved
 * quotation was broken while creating one looked fine.
 */

import { quotationTripSchema } from '@/lib/business/quotations/schema';

const trip = (over: Record<string, unknown> = {}) => ({
  sort_order: 0,
  from_location_id: '11111111-1111-4111-8111-111111111111',
  to_location_id: '22222222-2222-4222-8222-222222222222',
  pickup_address: 'Atlantis The Palm, Palm Jumeirah',
  dropoff_address: 'Marina Walk, Dubai Marina',
  pickup_datetime: null,
  vehicle_type_id: '33333333-3333-4333-8333-333333333333',
  passenger_count: 1,
  adults: 1,
  children: 0,
  infants: 0,
  addons: [],
  net_base_price_aed: 100,
  net_addons_price_aed: 0,
  net_total_aed: 100,
  sell_total_aed: 120,
  price_mode: 'inherited' as const,
  markup_percent: null,
  ...over,
});

describe('pickup_datetime accepts every format the app actually produces', () => {
  it('accepts the client format (toISOString)', () => {
    const r = quotationTripSchema.safeParse(
      trip({ pickup_datetime: '2026-08-15T04:30:00.000Z' })
    );
    expect(r.success).toBe(true);
  });

  it('accepts the PostgREST format with a +00:00 offset. The case that broke editing', () => {
    const r = quotationTripSchema.safeParse(
      trip({ pickup_datetime: '2026-08-15T04:30:00+00:00' })
    );
    expect(r.success).toBe(true);
  });

  it('accepts a non-UTC offset, so a stored non-Dubai instant round-trips', () => {
    const r = quotationTripSchema.safeParse(
      trip({ pickup_datetime: '2026-08-15T08:30:00+04:00' })
    );
    expect(r.success).toBe(true);
  });

  it('accepts null. An undated quote is legitimate', () => {
    expect(quotationTripSchema.safeParse(trip({ pickup_datetime: null })).success).toBe(true);
  });

  it('still rejects a genuinely malformed datetime', () => {
    expect(quotationTripSchema.safeParse(trip({ pickup_datetime: 'next tuesday' })).success).toBe(
      false
    );
    // Postgres' own display format is not ISO 8601 and must not be accepted silently.
    expect(
      quotationTripSchema.safeParse(trip({ pickup_datetime: '2026-08-15 04:30:00+00' })).success
    ).toBe(false);
  });
});

describe('trip invariants mirror the database CHECKs', () => {
  it('rejects a passenger count that disagrees with the guest breakdown', () => {
    const r = quotationTripSchema.safeParse(trip({ passenger_count: 5, adults: 2 }));
    expect(r.success).toBe(false);
  });

  it('accepts a consistent breakdown, infants included as seats', () => {
    const r = quotationTripSchema.safeParse(
      trip({ passenger_count: 4, adults: 2, children: 1, infants: 1 })
    );
    expect(r.success).toBe(true);
  });

  it('rejects a round trip to the same location', () => {
    const r = quotationTripSchema.safeParse(
      trip({ to_location_id: '11111111-1111-4111-8111-111111111111' })
    );
    expect(r.success).toBe(false);
  });

  it('requires markup_percent on a pinned line and forbids it otherwise', () => {
    expect(
      quotationTripSchema.safeParse(trip({ price_mode: 'markup', markup_percent: null })).success
    ).toBe(false);
    expect(
      quotationTripSchema.safeParse(trip({ price_mode: 'markup', markup_percent: 50 })).success
    ).toBe(true);
    expect(
      quotationTripSchema.safeParse(trip({ price_mode: 'manual', markup_percent: 50 })).success
    ).toBe(false);
  });
});

describe('addon invariants mirror the database CHECKs', () => {
  const addon = (over: Record<string, unknown> = {}) => ({
    addon_id: '44444444-4444-4444-8444-444444444444',
    name_snapshot: 'Infant Car Seat',
    quantity: 1,
    unit_price: 10,
    total_price: 10,
    ...over,
  });

  it('accepts a child seat with one age per seat', () => {
    const r = quotationTripSchema.safeParse(
      trip({
        children: 1,
        passenger_count: 2,
        adults: 1,
        addons: [addon({ quantity: 2, total_price: 20, child_ages: [0, 4] })],
        net_addons_price_aed: 20,
        net_total_aed: 120,
      })
    );
    expect(r.success).toBe(true);
  });

  it('accepts an addon with no ages at all (not a child seat)', () => {
    const r = quotationTripSchema.safeParse(trip({ addons: [addon({ name_snapshot: 'WiFi' })] }));
    expect(r.success).toBe(true);
  });

  it('accepts an explicit null for a non-child addon', () => {
    // The DB column is nullable and non-child addons are stored as NULL, so a saved quotation
    // reloaded for editing sends null back. An `.optional()` field rejected that, which broke
    // saving any trip that had a luggage or comfort extra on it.
    const r = quotationTripSchema.safeParse(
      trip({ addons: [addon({ name_snapshot: 'Extra Luggage', child_ages: null })] })
    );
    expect(r.success).toBe(true);
  });

  it('rejects an ages/quantity mismatch', () => {
    // Mirrors business_quotation_item_addons_child_ages_valid: one age per seat, always.
    const r = quotationTripSchema.safeParse(
      trip({ addons: [addon({ quantity: 2, total_price: 20, child_ages: [5] })] })
    );
    expect(r.success).toBe(false);
  });

  it.each([[-1], [13]])('rejects an out-of-range age (%p)', (age) => {
    const r = quotationTripSchema.safeParse(trip({ addons: [addon({ child_ages: [age] })] }));
    expect(r.success).toBe(false);
  });

  it('rejects a total that is not unit_price x quantity', () => {
    // Mirrors bqia_total. Previously only the DB caught this, as a raw Postgres error at save.
    const r = quotationTripSchema.safeParse(
      trip({ addons: [addon({ quantity: 2, total_price: 10 })] })
    );
    expect(r.success).toBe(false);
  });
});
