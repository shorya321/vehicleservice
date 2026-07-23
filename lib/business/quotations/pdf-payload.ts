/**
 * Builds the customer-facing PDF payload from a quotation row.
 *
 * This module is the leak barrier. It is the ONLY constructor of QuotationPdfData, it reads
 * sell_total_aed and never touches the net_* columns, and QuotationPdfData has no field a
 * cost could be assigned to. Any future attempt to print margin would have to change this
 * file, the type, and the layout — which is the point.
 *
 * It is also where every currency conversion, rounding and date format happens, so the
 * document itself never derives a number.
 */

import { formatAmount, getCurrencyDecimalPlaces } from '@/lib/currency/format';
import { BOOKING_TIMEZONE } from '@/lib/utils/timezone';
import { parseThemeConfig, DEFAULT_THEME_CONFIG } from '@/lib/business/branding-utils';
import { safeHexColor, type PdfImageSource } from './brand-logo';
import type { QuotationPdfData, QuotationPdfLineItem } from '@/lib/pdf/generators/quotation';

/**
 * The narrow projection this module accepts.
 *
 * Deliberately NOT QuotationWithItems: by excluding the net_* columns from the input type,
 * the route's .select() can omit them and the compiler enforces that the cost never even
 * enters the function. That is the third layer of the leak barrier — the first two being the
 * absent fields on QuotationPdfData and this file never reading a cost.
 */
export interface QuotationPdfSourceItem {
  sort_order: number;
  from_location_id: string;
  to_location_id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_datetime: string | null;
  vehicle_type_id: string;
  passenger_count: number;
  adults: number;
  children: number;
  infants: number;
  description: string | null;
  /** The sell price. The only money on this type. */
  sell_total_aed: number;
  addons: Array<{ name_snapshot: string }>;
}

export interface QuotationPdfSource {
  quotation_number: string;
  created_at: string;
  updated_at: string;
  valid_until: string | null;
  currency: string;
  exchange_rate: number;
  customer_name: string;
  customer_company: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  /** Sell-side only: a discount is a concession to the customer, not a cost. */
  discount_aed: number;
  terms: string | null;
  notes: string | null;
  items: QuotationPdfSourceItem[];
}

/**
 * Route separator.
 *
 * NOT "→" (U+2192). @react-pdf's built-in Helvetica uses WinAnsi encoding, which has no
 * glyph for it — the arrow silently renders as a stray apostrophe on the customer's document.
 * "»" (U+00BB) is in WinAnsi, reads directionally, and needs no font registration.
 * "—" and "·" used elsewhere in this file are both WinAnsi and render correctly.
 */
const ROUTE_ARROW = '»';

/** Business fields the document needs. Deliberately narrow. */
export interface QuotationPdfBusiness {
  business_name: string;
  brand_name: string | null;
  business_email: string | null;
  business_phone: string | null;
  address: string | null;
  logo_url: string | null;
  theme_config: unknown;
}

/**
 * Round to the display currency's precision.
 * KWD/BHD/OMR use 3 decimals and JPY/KRW use 0, so a hardcoded 2 would visibly corrupt
 * totals in those currencies.
 */
function roundTo(amount: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: BOOKING_TIMEZONE,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: BOOKING_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/** "2 adults, 1 child" — infants named separately since each still occupies a seat. */
function guestSummary(item: QuotationPdfSourceItem): string {
  const parts: string[] = [];
  if (item.adults > 0) parts.push(`${item.adults} adult${item.adults === 1 ? '' : 's'}`);
  if (item.children > 0) parts.push(`${item.children} child${item.children === 1 ? '' : 'ren'}`);
  if (item.infants > 0) parts.push(`${item.infants} infant${item.infants === 1 ? '' : 's'}`);
  return parts.length > 0 ? parts.join(', ') : `${item.passenger_count} passengers`;
}

export interface BuildQuotationPdfArgs {
  quotation: QuotationPdfSource;
  business: QuotationPdfBusiness;
  logo: PdfImageSource | null;
  /** Resolved route labels, keyed by location id, so the document reads as places not UUIDs. */
  locationNames: Record<string, string>;
  vehicleNames: Record<string, string>;
  preparedBy?: string;
}

/**
 * Convert an AED amount into the quotation's locked display currency.
 * The rate is frozen on the row, so a PDF already in a customer's hands never changes value
 * even as live rates move.
 */
function toDisplay(aed: number, rate: number, decimals: number): number {
  return roundTo(aed * rate, decimals);
}

export function buildQuotationPdfData({
  quotation,
  business,
  logo,
  locationNames,
  vehicleNames,
  preparedBy,
}: BuildQuotationPdfArgs): QuotationPdfData {
  const currency = quotation.currency || 'AED';
  const decimals = getCurrencyDecimalPlaces(currency);
  const rate = Number(quotation.exchange_rate) || 1;

  const theme = parseThemeConfig(business.theme_config);
  const accentColor = safeHexColor(
    theme?.accent?.primary,
    DEFAULT_THEME_CONFIG.accent.primary
  );

  const ordered = [...quotation.items].sort((a, b) => a.sort_order - b.sort_order);

  // Convert and round EACH line, then sum the rounded values. Converting the sum instead
  // would produce a document whose printed column does not add up to its printed total.
  let subtotalDisplay = 0;
  const lineItems: QuotationPdfLineItem[] = ordered.map((item, index) => {
    const lineDisplay = toDisplay(Number(item.sell_total_aed), rate, decimals);
    subtotalDisplay = roundTo(subtotalDisplay + lineDisplay, decimals);

    const from = locationNames[item.from_location_id] ?? item.pickup_address;
    const to = locationNames[item.to_location_id] ?? item.dropoff_address;

    // Addons are NAMED without prices: itemising a quotation invites line-by-line haggling.
    const addonNames = item.addons.map((a: { name_snapshot: string }) => a.name_snapshot).filter(Boolean);

    return {
      label: `Trip ${index + 1} of ${ordered.length}`,
      route: `${from} ${ROUTE_ARROW} ${to}`,
      when: formatDateTime(item.pickup_datetime),
      vehicle: vehicleNames[item.vehicle_type_id] ?? 'Vehicle',
      guests: guestSummary(item),
      addons: addonNames.length > 0 ? addonNames.join(', ') : undefined,
      notes: item.description ?? undefined,
      amount: formatAmount(lineDisplay, currency),
    };
  });

  const discountDisplay = toDisplay(Number(quotation.discount_aed), rate, decimals);
  const totalDisplay = roundTo(subtotalDisplay - discountDisplay, decimals);

  // Only surface "Updated" once the row has actually been revised. Comparing to the second
  // avoids showing it on a quotation that was merely saved once.
  const wasRevised =
    new Date(quotation.updated_at).getTime() - new Date(quotation.created_at).getTime() > 1000;

  return {
    quotationNumber: quotation.quotation_number,
    issuedDate: formatDate(quotation.created_at),
    validUntil: quotation.valid_until ? formatDate(quotation.valid_until) : undefined,
    updatedDate: wasRevised ? formatDate(quotation.updated_at) : undefined,

    brandName: business.brand_name || business.business_name,
    companyEmail: business.business_email ?? undefined,
    companyPhone: business.business_phone ?? undefined,
    companyAddress: business.address ?? undefined,
    logo,
    accentColor,

    customerName: quotation.customer_name,
    customerCompany: quotation.customer_company ?? undefined,
    customerEmail: quotation.customer_email ?? undefined,
    customerPhone: quotation.customer_phone ?? undefined,
    preparedBy,

    lineItems,

    subtotalDisplay: formatAmount(subtotalDisplay, currency),
    discountDisplay:
      discountDisplay > 0 ? `-${formatAmount(discountDisplay, currency)}` : undefined,
    totalDisplay: formatAmount(totalDisplay, currency),

    terms: quotation.terms ?? undefined,
    notes: quotation.notes ?? undefined,
    generatedDate: formatDate(new Date().toISOString()),
  };
}
