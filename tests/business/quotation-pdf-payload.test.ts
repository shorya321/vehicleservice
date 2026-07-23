/**
 * The two guarantees the quotation PDF payload exists to provide:
 *
 *  1. The business's internal cost never reaches the customer's document.
 *  2. The printed line amounts add up to the printed total, in every currency.
 *
 * Both are the kind of thing that is only embarrassing once it has already been emailed to a
 * client, so they are pinned here rather than left to review.
 */

import { buildQuotationPdfData } from '@/lib/business/quotations/pdf-payload';
import type {
  QuotationWithItems,
  QuotationItemWithAddons,
} from '@/lib/business/quotations/types';

const business = {
  business_name: 'Acme Transfers',
  brand_name: 'Acme Travel',
  business_email: 'ops@acme.test',
  business_phone: '+971500000000',
  address: 'Business Bay, Dubai',
  logo_url: null,
  theme_config: null,
};

const item = (over: Partial<QuotationItemWithAddons> = {}): QuotationItemWithAddons =>
  ({
    id: 'item-1',
    quotation_id: 'q-1',
    business_account_id: 'b-1',
    sort_order: 0,
    from_location_id: 'loc-a',
    to_location_id: 'loc-b',
    pickup_address: 'DXB T3',
    dropoff_address: 'Dubai Marina',
    pickup_datetime: '2026-03-12T10:30:00.000Z',
    vehicle_type_id: 'veh-1',
    passenger_count: 3,
    adults: 2,
    children: 1,
    infants: 0,
    description: null,
    net_base_price_aed: 700,
    net_addons_price_aed: 150,
    net_total_aed: 850,
    net_quoted_at: null,
    sell_total_aed: 1020,
    price_mode: 'inherited',
    markup_percent: null,
    conversion_nonce: 'qi_x',
    converted_booking_id: null,
    converted_booking_number: null,
    converted_at: null,
    conversion_error: null,
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
    addons: [],
    ...over,
  }) as QuotationItemWithAddons;

const quotation = (over: Partial<QuotationWithItems> = {}): QuotationWithItems =>
  ({
    id: 'q-1',
    quotation_number: 'QUO07260001',
    business_account_id: 'b-1',
    created_by_user_id: 'u-1',
    customer_name: 'Ahmed Khan',
    customer_company: 'Khan Tours',
    customer_email: 'ahmed@khan.test',
    customer_phone: '+971501111111',
    title: null,
    notes: null,
    terms: null,
    status: 'draft',
    valid_until: null,
    currency: 'AED',
    exchange_rate: 1,
    default_markup_pct: 20,
    subtotal_net_aed: 850,
    subtotal_sell_aed: 1020,
    discount_aed: 0,
    total_sell_aed: 1020,
    accepted_at: null,
    rejected_at: null,
    converting_started_at: null,
    converted_at: null,
    created_at: '2026-03-01T00:00:00.000Z',
    updated_at: '2026-03-01T00:00:00.000Z',
    items: [item()],
    ...over,
  }) as QuotationWithItems;

const build = (q: QuotationWithItems) =>
  buildQuotationPdfData({
    quotation: q,
    business,
    logo: null,
    locationNames: { 'loc-a': 'DXB Terminal 3', 'loc-b': 'Dubai Marina' },
    vehicleNames: { 'veh-1': 'Luxury Sedan' },
  });

/** Every string the document will actually render. */
const renderedText = (data: ReturnType<typeof build>): string =>
  JSON.stringify(data);

describe('net cost never leaks into the PDF payload', () => {
  it('contains the sell price but not the net cost', () => {
    const data = build(quotation());
    const text = renderedText(data);

    expect(text).toContain('1,020.00');
    // 850 is the net. It must appear nowhere in the customer-facing payload.
    expect(text).not.toContain('850');
  });

  it('exposes no cost, markup or margin field', () => {
    const data = build(quotation());
    const keys = Object.keys(data).join(',').toLowerCase();

    expect(keys).not.toContain('net');
    expect(keys).not.toContain('markup');
    expect(keys).not.toContain('margin');
    expect(keys).not.toContain('cost');
  });

  it('does not leak addon prices — addons are named only', () => {
    const data = build(
      quotation({
        items: [
          item({
            addons: [
              {
                addon_id: 'a-1',
                name_snapshot: 'Meet & Greet',
                quantity: 1,
                unit_price: 150,
                total_price: 150,
              },
            ],
          }),
        ],
      })
    );

    expect(data.lineItems[0].addons).toBe('Meet & Greet');
    expect(data.lineItems[0].addons).not.toContain('150');
  });
});

describe('printed amounts reconcile', () => {
  it('line amounts sum to the printed total', () => {
    const data = build(
      quotation({
        items: [
          item({ id: 'i1', sort_order: 0, sell_total_aed: 1020 }),
          item({ id: 'i2', sort_order: 1, sell_total_aed: 920 }),
          item({ id: 'i3', sort_order: 2, sell_total_aed: 333.33 }),
        ],
      })
    );

    const parse = (s: string) => Number(s.replace(/[^0-9.-]/g, ''));
    const lineSum = data.lineItems.reduce((acc, l) => acc + parse(l.amount), 0);

    expect(parse(data.subtotalDisplay)).toBeCloseTo(lineSum, 2);
    expect(parse(data.totalDisplay)).toBeCloseTo(lineSum, 2);
  });

  it('applies the locked exchange rate rather than a live one', () => {
    const data = build(quotation({ currency: 'EUR', exchange_rate: 0.25 }));
    // 1020 AED at the frozen 0.25 rate.
    expect(data.totalDisplay).toContain('255.00');
    expect(data.totalDisplay).toContain('EUR');
  });

  it('reconciles in a 0-decimal currency (JPY)', () => {
    const data = build(
      quotation({
        currency: 'JPY',
        exchange_rate: 40.5,
        items: [
          item({ id: 'i1', sort_order: 0, sell_total_aed: 10.11 }),
          item({ id: 'i2', sort_order: 1, sell_total_aed: 10.11 }),
        ],
      })
    );

    const parse = (s: string) => Number(s.replace(/[^0-9.-]/g, ''));
    const lineSum = data.lineItems.reduce((acc, l) => acc + parse(l.amount), 0);
    expect(parse(data.totalDisplay)).toBe(lineSum);
  });

  it('reconciles in a 3-decimal currency (KWD)', () => {
    const data = build(
      quotation({
        currency: 'KWD',
        exchange_rate: 0.0833,
        items: [
          item({ id: 'i1', sort_order: 0, sell_total_aed: 333.33 }),
          item({ id: 'i2', sort_order: 1, sell_total_aed: 333.33 }),
        ],
      })
    );

    const parse = (s: string) => Number(s.replace(/[^0-9.-]/g, ''));
    const lineSum = data.lineItems.reduce((acc, l) => acc + parse(l.amount), 0);
    expect(parse(data.totalDisplay)).toBeCloseTo(lineSum, 3);
  });

  it('shows a discount as a negative and deducts it from the total', () => {
    const data = build(quotation({ discount_aed: 100, total_sell_aed: 920 }));
    expect(data.discountDisplay).toContain('-');
    expect(data.totalDisplay).toContain('920.00');
  });

  it('omits the discount row entirely when there is none', () => {
    expect(build(quotation()).discountDisplay).toBeUndefined();
  });
});

describe('document metadata', () => {
  it('orders trips by sort_order, not array order', () => {
    const data = build(
      quotation({
        items: [
          item({ id: 'b', sort_order: 1, pickup_address: 'Second' }),
          item({ id: 'a', sort_order: 0, pickup_address: 'First' }),
        ],
      })
    );
    expect(data.lineItems[0].label).toBe('Trip 1 of 2');
    expect(data.lineItems[1].label).toBe('Trip 2 of 2');
  });

  it('marks an undated trip rather than printing an invalid date', () => {
    const data = build(quotation({ items: [item({ pickup_datetime: null })] }));
    expect(data.lineItems[0].when).toBe('—');
  });

  it('omits "Updated" on a quotation that was never revised', () => {
    expect(build(quotation()).updatedDate).toBeUndefined();
  });

  it('shows "Updated" once revised, so the customer knows which copy is current', () => {
    const data = build(quotation({ updated_at: '2026-03-09T00:00:00.000Z' }));
    expect(data.updatedDate).toBeDefined();
  });

  it('prefers the brand name over the legal business name', () => {
    expect(build(quotation()).brandName).toBe('Acme Travel');
  });

  it('falls back to the business name when no brand name is set', () => {
    const data = buildQuotationPdfData({
      quotation: quotation(),
      business: { ...business, brand_name: null },
      logo: null,
      locationNames: {},
      vehicleNames: {},
    });
    expect(data.brandName).toBe('Acme Transfers');
  });

  it('falls back to a valid accent colour when theme_config is malformed', () => {
    const data = buildQuotationPdfData({
      quotation: quotation(),
      business: { ...business, theme_config: { accent: { primary: 'not-a-colour' } } },
      logo: null,
      locationNames: {},
      vehicleNames: {},
    });
    // @react-pdf throws on a malformed colour, so this must always be a real hex.
    expect(data.accentColor).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
