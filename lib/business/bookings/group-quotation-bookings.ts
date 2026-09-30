/**
 * Folds the bookings converted from one quotation into a single list entry.
 *
 * A quotation with several trips converts into one business_bookings row per
 * trip, and nothing on the booking row says which rows belong together. The
 * link lives on business_quotation_items.converted_booking_id, so the page
 * passes those links in and the list groups on them.
 *
 * Display only: the bookings themselves are returned untouched.
 *
 * SCOPE: Business module ONLY
 */

export interface QuotationBookingLink {
  bookingId: string;
  quotationId: string;
  quotationNumber: string | null;
  sortOrder: number;
}

interface GroupableBooking {
  id: string;
  pickup_datetime: string;
}

export type BookingListEntry<T extends GroupableBooking> =
  | { kind: 'single'; booking: T }
  | {
      kind: 'quotation';
      quotationId: string;
      quotationNumber: string | null;
      /** The trips visible after search and filter, in quotation order. */
      bookings: T[];
      /** Every trip of this quotation in the loaded list, filtered or not. */
      totalTrips: number;
    };

/**
 * Groups rows that share a quotation. A group takes the place of its first row,
 * so the list keeps its existing order. Only two or more visible trips make a
 * group; a lone trip stays a plain row.
 */
export function groupQuotationBookings<T extends GroupableBooking>(
  rows: readonly T[],
  links: readonly QuotationBookingLink[]
): BookingListEntry<T>[] {
  const linkByBooking = new Map(links.map((l) => [l.bookingId, l]));

  const tripsPerQuotation = new Map<string, number>();
  for (const l of links) {
    tripsPerQuotation.set(l.quotationId, (tripsPerQuotation.get(l.quotationId) ?? 0) + 1);
  }

  const rowsByQuotation = new Map<string, T[]>();
  for (const r of rows) {
    const quotationId = linkByBooking.get(r.id)?.quotationId;
    if (!quotationId) continue;
    rowsByQuotation.set(quotationId, [...(rowsByQuotation.get(quotationId) ?? []), r]);
  }

  const byQuotationOrder = (a: T, b: T): number => {
    const bySort = (linkByBooking.get(a.id)?.sortOrder ?? 0) - (linkByBooking.get(b.id)?.sortOrder ?? 0);
    if (bySort !== 0) return bySort;
    return new Date(a.pickup_datetime).getTime() - new Date(b.pickup_datetime).getTime();
  };

  const emitted = new Set<string>();
  const entries: BookingListEntry<T>[] = [];

  for (const r of rows) {
    const link = linkByBooking.get(r.id);
    const groupRows = link ? rowsByQuotation.get(link.quotationId) ?? [] : [];

    if (!link || groupRows.length < 2) {
      entries.push({ kind: 'single', booking: r });
      continue;
    }

    if (emitted.has(link.quotationId)) continue;
    emitted.add(link.quotationId);

    entries.push({
      kind: 'quotation',
      quotationId: link.quotationId,
      quotationNumber: link.quotationNumber,
      bookings: [...groupRows].sort(byQuotationOrder),
      totalTrips: tripsPerQuotation.get(link.quotationId) ?? groupRows.length,
    });
  }

  return entries;
}

/** Every booking held by a set of entries, in display order. */
export function flattenBookingEntries<T extends GroupableBooking>(
  entries: readonly BookingListEntry<T>[]
): T[] {
  return entries.flatMap((e) => (e.kind === 'single' ? [e.booking] : e.bookings));
}
