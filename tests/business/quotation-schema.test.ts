/**
 * Quotation trip validation.
 *
 * The datetime cases exist because of a real bug found in browser testing: PostgREST returns
 * timestamptz as "2026-08-15T04:30:00+00:00", and a bare `z.string().datetime()` accepts only
 * a "Z" suffix. Creating a quotation worked (the client sends toISOString()), but RE-SAVING one
 * that already had a dated trip failed with "Invalid datetime format" — so editing a saved
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

  it('accepts the PostgREST format with a +00:00 offset — the case that broke editing', () => {
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

  it('accepts null — an undated quote is legitimate', () => {
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
