/**
 * Quotation lifecycle and edit-lock rules.
 *
 * Dependency-free on purpose: both the server actions and the client builder import this, so
 * it must not pull in next/headers, next/server or the Supabase client. Same reasoning as
 * lib/business/roles.ts.
 */

/**
 * Stored statuses. `expired` is deliberately NOT one of them — nothing would transition a row
 * into it without a scheduled job, so expiry is derived from valid_until at read time.
 */
export const QUOTATION_STATUSES = [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'converting',
  'partially_converted',
  'converted',
] as const;

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

/** What the UI shows. `expired` appears here but is derived, never stored. */
export type QuotationDisplayStatus = QuotationStatus | 'expired';

export const QUOTATION_STATUS_LABELS: Record<QuotationDisplayStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
  converting: 'Converting',
  partially_converted: 'Partly Converted',
  converted: 'Converted',
  expired: 'Expired',
};

/** The column is plain TEXT, so anything unrecognised falls back to the safest value. */
export function normalizeQuotationStatus(status: unknown): QuotationStatus {
  return QUOTATION_STATUSES.includes(status as QuotationStatus)
    ? (status as QuotationStatus)
    : 'draft';
}

/**
 * Expiry is derived, never stored.
 *
 * Only an outstanding quotation can expire — once a customer has accepted, or any line has
 * been converted, the validity window has served its purpose and showing "Expired" would be
 * actively misleading.
 *
 * `validUntil` is a DATE column (no timezone). Bookings run on Asia/Dubai, so this compares
 * date strings rather than instants to avoid a UTC-vs-Dubai off-by-one at either end of the day.
 */
export function isQuotationExpired(
  status: QuotationStatus,
  validUntil: string | null,
  todayIso: string
): boolean {
  if (!validUntil) return false;
  if (status !== 'draft' && status !== 'sent') return false;
  return validUntil < todayIso;
}

export function displayStatus(
  status: QuotationStatus,
  validUntil: string | null,
  todayIso: string
): QuotationDisplayStatus {
  return isQuotationExpired(status, validUntil, todayIso) ? 'expired' : status;
}

/**
 * Header editing (customer, terms, discount, default markup).
 *
 * Locked only while a conversion is in flight or complete. `sent` and `accepted` both stay
 * editable — customers routinely renegotiate after saying yes, and forcing a brand-new
 * quotation for a changed pickup time is the kind of friction that pushes people back to
 * WhatsApp.
 */
export function canEditHeader(status: QuotationStatus): boolean {
  return status !== 'converting' && status !== 'converted';
}

/**
 * Line editing.
 *
 * A converted line is immutable regardless of the header's status: the wallet has been
 * charged and a real booking exists. This is what lets a `partially_converted` quotation keep
 * 2 trips booked while 3 are still under negotiation.
 */
export function canEditLine(
  status: QuotationStatus,
  convertedBookingId: string | null
): boolean {
  if (convertedBookingId) return false;
  return status !== 'converting' && status !== 'converted';
}

/** Adding or removing trips follows the same rule as editing the header. */
export function canAddLines(status: QuotationStatus): boolean {
  return canEditHeader(status);
}

/**
 * Whether a conversion may start.
 *
 * `partially_converted` is included so a run interrupted by a timeout can be resumed — the
 * per-line conversion_nonce makes that retry safe against double-charging.
 * `converting` is excluded here, but the real guard is the conditional UPDATE in the route;
 * this only decides whether to show the button.
 */
export function canConvert(status: QuotationStatus): boolean {
  return status === 'accepted' || status === 'partially_converted';
}

/**
 * Deleting is blocked once any line has become a booking — the link between a booking and the
 * quotation it came from is the only audit trail of why that money moved. The FK is RESTRICT,
 * so the database refuses regardless; this exists so the UI can fail cleanly first.
 */
export function canDelete(status: QuotationStatus, hasConvertedLines: boolean): boolean {
  if (hasConvertedLines) return false;
  return status !== 'converting' && status !== 'converted';
}

/**
 * Whether the locked FX rate should be refreshed on save.
 *
 * Only while the quotation is still a draft. Once it has been sent, the customer is holding a
 * PDF with specific numbers on it, and silently re-rating those numbers underneath them is
 * indefensible.
 */
export function shouldRelockExchangeRate(status: QuotationStatus): boolean {
  return status === 'draft';
}
