import {
  fromWizardLeg,
  journeyCount,
  shiftTripByDays,
  switchTripType,
  toWizardLeg,
  tripAddressesReady,
  tripRouteReady,
} from '@/lib/business/quotations/trip-legs';
import type { QuotationTripDraft } from '@/lib/business/quotations/types';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

const oneWay = (over: Partial<QuotationTripDraft> = {}): QuotationTripDraft => ({
  sort_order: 0,
  from_location_id: A,
  to_location_id: B,
  from_location_name: 'Airport',
  to_location_name: 'Marina',
  pickup_address: 'Terminal 3 arrivals',
  dropoff_address: 'Marina Walk tower',
  pickup_datetime: '2026-12-01T06:00:00.000Z',
  vehicle_type_id: 'v1',
  passenger_count: 1,
  adults: 1,
  children: 0,
  infants: 0,
  description: null,
  addons: [],
  net_base_price_aed: 100,
  net_addons_price_aed: 0,
  net_total_aed: 100,
  sell_total_aed: 120,
  price_mode: 'inherited',
  markup_percent: null,
  ...over,
});

describe('wizard leg conversion', () => {
  it('round-trips an instant through operating-timezone date and time', () => {
    const leg = { ...oneWay(), pickup_datetime: '2026-12-01T06:00:00.000Z' };
    const wizard = toWizardLeg(leg);
    expect(wizard.date).toBe('2026-12-01');
    expect(wizard.time).toBe('10:00'); // Asia/Dubai, UTC+4
    expect(fromWizardLeg(wizard).pickup_datetime).toBe('2026-12-01T06:00:00.000Z');
  });

  it('treats a missing date or time as undated', () => {
    expect(fromWizardLeg({ ...toWizardLeg(oneWay()), time: '' }).pickup_datetime).toBeNull();
  });
});

describe('switchTripType', () => {
  it('turns a one way into a round trip with the return mirrored, clearing the vehicle', () => {
    const patch = switchTripType(oneWay(), 'round_trip');
    expect(patch.trip_type).toBe('round_trip');
    expect(patch.legs).toHaveLength(2);
    expect(patch.legs?.[1].from_location_id).toBe(B);
    expect(patch.legs?.[1].to_location_id).toBe(A);
    expect(patch.legs?.[1].pickup_datetime).toBeNull();
    expect(patch.vehicle_type_id).toBe('');
    expect(patch.from_location_id).toBe(A);
  });

  it('turns a trip into hourly with no destination and a default package', () => {
    const patch = switchTripType(oneWay(), 'hourly');
    expect(patch.to_location_id).toBe('');
    expect(patch.dropoff_address).toBe('');
    expect(patch.hourly_package).toBe('half_day');
    expect(patch.pickup_datetime).toBe('2026-12-01T06:00:00.000Z');
  });

  it('turns a round trip back into a one way from its outbound', () => {
    const round = { ...oneWay(), ...switchTripType(oneWay(), 'round_trip') } as QuotationTripDraft;
    const patch = switchTripType(round, 'one_way');
    expect(patch.legs).toEqual([]);
    expect(patch.to_location_id).toBe(B);
  });

  it('is a no-op for the current type', () => {
    expect(switchTripType(oneWay(), 'one_way')).toEqual({});
  });
});

describe('readiness and journeys', () => {
  it('needs every journey dated before a round trip can be priced', () => {
    const round = { ...oneWay(), ...switchTripType(oneWay(), 'round_trip') } as QuotationTripDraft;
    expect(tripRouteReady(round)).toBe(false);
    const dated = { ...round, legs: round.legs?.map((l) => ({ ...l, pickup_datetime: '2026-12-03T06:00:00.000Z' })) };
    expect(tripRouteReady(dated)).toBe(true);
    expect(journeyCount(dated)).toBe(2);
    expect(tripAddressesReady(dated)).toBe(true);
  });

  it('counts a one way and an hourly trip as one journey', () => {
    expect(journeyCount(oneWay())).toBe(1);
    expect(journeyCount({ ...oneWay(), trip_type: 'hourly' })).toBe(1);
  });

  it('shifts every journey when a trip is duplicated', () => {
    const round = { ...oneWay(), ...switchTripType(oneWay(), 'round_trip') } as QuotationTripDraft;
    const dated = { ...round, legs: round.legs?.map((l) => ({ ...l, pickup_datetime: '2026-12-03T06:00:00.000Z' })) };
    const shifted = shiftTripByDays(dated, 1);
    expect(shifted.legs?.[1].pickup_datetime).toBe('2026-12-04T06:00:00.000Z');
  });
});
