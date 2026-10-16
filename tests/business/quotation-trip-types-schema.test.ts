/**
 * Quotation trips carry the same four trip types as business bookings. A trip saved before trip
 * types existed has no trip_type and must still validate as one way.
 */

import { quotationTripSchema } from '@/lib/business/quotations/schema';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '44444444-4444-4444-8444-444444444444';

const leg = (from: string, to: string, at: string) => ({
  from_location_id: from,
  to_location_id: to,
  pickup_address: `Address of ${from.slice(0, 4)}`,
  dropoff_address: `Address of ${to.slice(0, 4)}`,
  pickup_datetime: at,
});

const trip = (over: Record<string, unknown> = {}) => ({
  sort_order: 0,
  from_location_id: A,
  to_location_id: B,
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

const OUT = '2026-12-01T06:00:00.000Z';
const BACK = '2026-12-03T10:00:00.000Z';

describe('one way', () => {
  it('defaults a trip without trip_type to one way', () => {
    const r = quotationTripSchema.safeParse(trip());
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.trip_type).toBe('one_way');
      expect(r.data.legs).toEqual([]);
    }
  });

  it('still requires a destination', () => {
    expect(quotationTripSchema.safeParse(trip({ to_location_id: '' })).success).toBe(false);
  });
});

describe('round trip', () => {
  const round = (over: Record<string, unknown> = {}) =>
    trip({ trip_type: 'round_trip', pickup_datetime: OUT, legs: [leg(A, B, OUT), leg(B, A, BACK)], ...over });

  it('accepts an outbound and its reverse', () => {
    expect(quotationTripSchema.safeParse(round()).success).toBe(true);
  });

  it('rejects a return that is not the outbound reversed', () => {
    expect(quotationTripSchema.safeParse(round({ legs: [leg(A, B, OUT), leg(B, C, BACK)] })).success).toBe(false);
  });

  it('rejects anything but two journeys', () => {
    expect(quotationTripSchema.safeParse(round({ legs: [leg(A, B, OUT)] })).success).toBe(false);
  });

  it('requires every journey to be dated', () => {
    const undated = { ...leg(B, A, BACK), pickup_datetime: null };
    expect(quotationTripSchema.safeParse(round({ legs: [leg(A, B, OUT), undated] })).success).toBe(false);
  });

  it('rejects journeys out of order', () => {
    expect(quotationTripSchema.safeParse(round({ legs: [leg(A, B, BACK), leg(B, A, OUT)] })).success).toBe(false);
  });
});

describe('multi-city', () => {
  const multi = (legs: unknown[]) => trip({ trip_type: 'multi_city', pickup_datetime: OUT, legs });

  it('accepts two to six journeys', () => {
    expect(quotationTripSchema.safeParse(multi([leg(A, B, OUT), leg(B, C, BACK)])).success).toBe(true);
  });

  it('rejects a single journey', () => {
    expect(quotationTripSchema.safeParse(multi([leg(A, B, OUT)])).success).toBe(false);
  });

  it('rejects more than six journeys', () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      leg(i % 2 ? B : A, i % 2 ? A : B, `2026-12-0${i + 1}T06:00:00.000Z`)
    );
    expect(quotationTripSchema.safeParse(multi(many)).success).toBe(false);
  });
});

describe('hourly', () => {
  const hourly = (over: Record<string, unknown> = {}) =>
    trip({
      trip_type: 'hourly',
      to_location_id: '',
      dropoff_address: '',
      pickup_datetime: OUT,
      hourly_package: 'half_day',
      ...over,
    });

  it('accepts a pickup, a start time and a package with no destination', () => {
    const r = quotationTripSchema.safeParse(hourly());
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.to_location_id).toBeNull();
  });

  it('requires a package', () => {
    expect(quotationTripSchema.safeParse(hourly({ hourly_package: null })).success).toBe(false);
  });

  it('requires a start time', () => {
    expect(quotationTripSchema.safeParse(hourly({ pickup_datetime: null })).success).toBe(false);
  });
});
