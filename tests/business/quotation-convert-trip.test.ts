jest.mock('server-only', () => ({}), { virtual: true });

/**
 * A quotation trip is converted by handing the booking wizard's own pricer and RPC exactly the
 * trip the wizard would have submitted. These pin that translation.
 */

import { isTripConversion, tripBodyFor } from '@/lib/business/quotations/convert-trip';
import type { ConvertibleItem, ConvertibleQuotation } from '@/lib/business/quotations/convert';

const quotation: ConvertibleQuotation = {
  id: 'q1',
  quotation_number: 'VRM10260004',
  business_account_id: 'b1',
  customer_name: 'QA',
  customer_email: 'qa@example.com',
  customer_phone: '+971500000001',
};

const item = (over: Partial<ConvertibleItem> = {}): ConvertibleItem => ({
  id: 'i1',
  from_location_id: 'A',
  to_location_id: 'B',
  pickup_address: 'DXB T3',
  dropoff_address: 'Marina',
  pickup_datetime: '2026-10-21T08:00:00.000Z',
  vehicle_type_id: 'v1',
  passenger_count: 2,
  adults: 1,
  children: 1,
  infants: 0,
  net_total_aed: 430,
  sell_total_aed: 516,
  conversion_nonce: 'qi_1',
  converted_booking_id: null,
  addons: [{ addon_id: 'seat', quantity: 1, child_ages: [3] }],
  ...over,
});

describe('isTripConversion', () => {
  it('keeps one way, and trips saved before trip types, on the original path', () => {
    expect(isTripConversion(item())).toBe(false);
    expect(isTripConversion(item({ trip_type: 'one_way' }))).toBe(false);
    expect(isTripConversion(item({ trip_type: 'round_trip' }))).toBe(true);
    expect(isTripConversion(item({ trip_type: 'hourly' }))).toBe(true);
  });
});

describe('tripBodyFor', () => {
  it('turns stored journeys into operating-timezone date and time', () => {
    const body = tripBodyFor(
      quotation,
      item({
        trip_type: 'round_trip',
        legs: [
          { from_location_id: 'A', to_location_id: 'B', pickup_address: 'DXB T3', dropoff_address: 'Marina', pickup_datetime: '2026-10-21T08:00:00.000Z' },
          { from_location_id: 'B', to_location_id: 'A', pickup_address: 'Marina', dropoff_address: 'DXB T3', pickup_datetime: '2026-10-23T08:00:00.000Z' },
        ],
      })
    );
    expect(body?.trip_type).toBe('round_trip');
    if (body?.trip_type !== 'round_trip') return;
    expect(body.legs.map((l) => [l.date, l.time])).toEqual([
      ['2026-10-21', '12:00'],
      ['2026-10-23', '12:00'],
    ]);
    expect(body.price_signature_nonce).toBe('qi_1');
    expect(body.selected_addons).toEqual([{ addon_id: 'seat', quantity: 1, child_ages: [3] }]);
  });

  it('builds an hourly hire from the trip itself', () => {
    const body = tripBodyFor(quotation, item({ trip_type: 'hourly', to_location_id: null, hourly_package: 'full_day' }));
    expect(body?.trip_type).toBe('hourly');
    if (body?.trip_type !== 'hourly') return;
    expect(body.hourly).toEqual({
      from_location_id: 'A',
      pickup_address: 'DXB T3',
      hourly_package: 'full_day',
      date: '2026-10-21',
      time: '12:00',
    });
  });

  it('prices the chosen alternative vehicle when asked', () => {
    expect(tripBodyFor(quotation, item({ trip_type: 'hourly', hourly_package: 'half_day' }), 'v2')?.vehicle_type_id).toBe('v2');
  });

  it('refuses an hourly trip without a valid package', () => {
    expect(tripBodyFor(quotation, item({ trip_type: 'hourly', hourly_package: null }))).toBeNull();
  });
});
