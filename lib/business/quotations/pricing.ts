/**
 * Quotation pricing math.
 *
 * Deliberately pure and dependency-free so it runs under the repo's `testEnvironment: 'node'`
 * jest config, exactly like lib/business/wizard-pricing.ts.
 *
 * Two different numbers live here and must never be confused:
 *   net  - what the platform will charge the business's wallet at conversion. Internal.
 *   sell - what the business quotes their customer. The only figure that reaches the PDF.
 *
 * Everything in this module is AED, matching the platform-wide invariant that prices are
 * stored in AED and converted only for display.
 */

/** Line pricing modes, mirroring business_quotation_items.price_mode. */
export type QuotationPriceMode = 'inherited' | 'markup' | 'manual';

export interface QuotationPricedLine {
  net_total_aed: number;
  sell_total_aed: number;
  price_mode: QuotationPriceMode;
  markup_percent: number | null;
}

export interface QuotationTotals {
  subtotalNetAed: number;
  subtotalSellAed: number;
  discountAed: number;
  totalSellAed: number;
  /** Absolute margin in AED. Internal only. */
  marginAed: number;
  /** Blended margin over the whole quotation, or null when nothing is being sold. */
  marginPct: number | null;
}

/**
 * Round to AED's 2 decimals.
 *
 * `basePrice = zone_pricing.base_price * multiplier` routinely produces values like
 * 287.49999999999994, and the DB columns are numeric(12,2). Rounding at every boundary keeps
 * the stored row, the on-screen figure and the PDF from disagreeing by fractions.
 *
 * Uses an epsilon nudge because JS `Math.round(1.005 * 100) / 100` gives 1 — the classic
 * float-representation trap that would round a half-fils the wrong way.
 */
export function roundAed(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Apply a percentage markup to a net cost.
 * A negative percentage is permitted — a business may deliberately quote below cost.
 */
export function applyMarkup(netAed: number, markupPercent: number): number {
  if (!Number.isFinite(netAed) || netAed < 0) return 0;
  const pct = Number.isFinite(markupPercent) ? markupPercent : 0;
  // Round the net FIRST. net_total_aed is numeric(12,2), so the stored value is already
  // 2dp; rounding here makes the function agree with the database whether or not the
  // caller pre-rounded. Skipping it means raw float noise (287.49999999999994) lands just
  // under a half-fils boundary and the markup rounds down a fils against the business.
  return roundAed(roundAed(netAed) * (1 + pct / 100));
}

/**
 * Which percentage actually governs a line.
 *
 * `inherited` follows the quotation default and keeps following it as that default changes.
 * `markup` is pinned to the line. `manual` has no percentage at all — the sell price was
 * typed directly — so it returns null and callers must not derive a price from it.
 */
export function resolveMarkupPct(
  line: Pick<QuotationPricedLine, 'price_mode' | 'markup_percent'>,
  defaultMarkupPct: number
): number | null {
  if (line.price_mode === 'manual') return null;
  if (line.price_mode === 'markup') return line.markup_percent ?? 0;
  return defaultMarkupPct;
}

/**
 * The sell price for a line.
 *
 * For `manual`, the stored sell price is authoritative and is returned untouched — this is
 * what makes a manual override survive a change to the quotation's default markup.
 */
export function lineSellPrice(line: QuotationPricedLine, defaultMarkupPct: number): number {
  const pct = resolveMarkupPct(line, defaultMarkupPct);
  if (pct === null) return roundAed(line.sell_total_aed);
  return applyMarkup(line.net_total_aed, pct);
}

/** Margin as a percentage of net. Null when net is 0, since the ratio is undefined. */
export function marginPct(netAed: number, sellAed: number): number | null {
  if (!Number.isFinite(netAed) || netAed <= 0) return null;
  return Math.round(((sellAed - netAed) / netAed) * 1000) / 10;
}

/**
 * Roll a quotation's lines up into its stored totals.
 *
 * The sum is taken over ALREADY-ROUNDED line prices. Summing raw values and rounding once at
 * the end would produce a document whose visible column does not add up to its visible total
 * — the single most embarrassing failure mode for a document a customer is negotiating over.
 */
export function quotationTotals(
  lines: QuotationPricedLine[],
  discountAed: number,
  defaultMarkupPct: number
): QuotationTotals {
  let subtotalNetAed = 0;
  let subtotalSellAed = 0;

  for (const line of lines) {
    subtotalNetAed = roundAed(subtotalNetAed + roundAed(line.net_total_aed));
    subtotalSellAed = roundAed(subtotalSellAed + lineSellPrice(line, defaultMarkupPct));
  }

  // Clamp: the DB enforces discount_aed <= subtotal_sell_aed, so never hand it a value that
  // would abort the write.
  const safeDiscount = Math.min(
    Math.max(roundAed(Number.isFinite(discountAed) ? discountAed : 0), 0),
    subtotalSellAed
  );

  const totalSellAed = roundAed(subtotalSellAed - safeDiscount);

  return {
    subtotalNetAed,
    subtotalSellAed,
    discountAed: safeDiscount,
    totalSellAed,
    marginAed: roundAed(totalSellAed - subtotalNetAed),
    marginPct: marginPct(subtotalNetAed, totalSellAed),
  };
}

/** True when the business would convert at a loss. Drives the inline warning and the convert gate. */
export function isBelowCost(netAed: number, sellAed: number): boolean {
  return roundAed(sellAed) < roundAed(netAed);
}
