/**
 * Trip types on the quotation PDF: a multi-journey trip lists every journey, an hourly hire
 * prints its package, and a one-way line is byte-for-byte what it was before trip types.
 */

import { buildQuotationPdfData, type QuotationPdfSourceItem } from '@/lib/business/quotations/pdf-payload';

const business = {
  business_name: 'Acme Transfers',
  brand_name: null,
  business_email: null,
  business_phone: null,
  address: null,
  logo_url: null,
  theme_config: null,
};

const baseItem: QuotationPdfSourceItem = {
  sort_order: 0,
  from_location_id: 'loc-a',
  to_location_id: 'loc-b',
  pickup_address: 'DXB T3',
  dropoff_address: 'Dubai Marina',
  pickup_datetime: '2026-12-01T06:00:00.000Z',
  vehicle_type_id: 'veh-1',
  passenger_count: 2,
  adults: 2,
  children: 0,
  infants: 0,
  description: null,
  sell_total_aed: 500,
  addons: [],
};

const build = (item: QuotationPdfSourceItem) =>
  buildQuotationPdfData({
    quotation: {
      quotation_number: 'QUO1',
      created_at: '2026-11-01T00:00:00.000Z',
      updated_at: '2026-11-01T00:00:00.000Z',
      valid_until: null,
      currency: 'AED',
      exchange_rate: 1,
      customer_name: 'Ahmed',
      customer_company: null,
      customer_email: null,
      customer_phone: null,
      discount_aed: 0,
      terms: null,
      notes: null,
      items: [item],
    },
    business,
    logo: null,
    locationNames: { 'loc-a': 'DXB Terminal 3', 'loc-b': 'Dubai Marina' },
    vehicleNames: { 'veh-1': 'Luxury Sedan' },
  }).lineItems[0];

describe('quotation PDF trip types', () => {
  it('leaves a one-way line unchanged', () => {
    const line = build(baseItem);
    expect(line.route).toBe('DXB Terminal 3 » Dubai Marina');
    expect(line.journeys).toBeUndefined();
    expect(line.service).toBeUndefined();
    expect(Object.keys(build({ ...baseItem, trip_type: 'one_way' }))).toEqual(Object.keys(line));
  });

  it('lists both journeys of a round trip', () => {
    const line = build({
      ...baseItem,
      trip_type: 'round_trip',
      legs: [
        { from_location_id: 'loc-a', to_location_id: 'loc-b', pickup_address: 'DXB T3', dropoff_address: 'Marina', pickup_datetime: '2026-12-01T06:00:00.000Z' },
        { from_location_id: 'loc-b', to_location_id: 'loc-a', pickup_address: 'Marina', dropoff_address: 'DXB T3', pickup_datetime: '2026-12-03T06:00:00.000Z' },
      ],
    });
    expect(line.route).toBe('Round trip · 2 journeys');
    expect(line.journeys?.map((j) => j.label)).toEqual(['Outbound', 'Return']);
    expect(line.journeys?.[1].route).toBe('Dubai Marina » DXB Terminal 3');
    expect(line.journeys?.[1].when).toContain('03 Dec 2026');
  });

  it('prints an hourly hire with its package and no destination', () => {
    const line = build({
      ...baseItem,
      trip_type: 'hourly',
      to_location_id: null,
      dropoff_address: 'As directed',
      hourly_package: 'half_day',
      duration_hours: 5,
      included_km: 100,
    });
    expect(line.route).toBe('DXB Terminal 3 » Hourly hire, as directed');
    expect(line.service).toBe('Half day · 5 h · 100 km included');
  });
});
