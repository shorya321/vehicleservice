/**
 * Quotation pricing math.
 *
 * The invariants worth protecting here are the ones that would embarrass the business in
 * front of their customer: a PDF column that does not add up, a manual override silently
 * overwritten by a default, or a below-cost sale going unnoticed.
 */

import {
  roundAed,
  applyMarkup,
  resolveMarkupPct,
  lineSellPrice,
  marginPct,
  quotationTotals,
  isBelowCost,
  type QuotationPricedLine,
} from '@/lib/business/quotations/pricing';

const line = (over: Partial<QuotationPricedLine> = {}): QuotationPricedLine => ({
  net_total_aed: 100,
  sell_total_aed: 0,
  price_mode: 'inherited',
  markup_percent: null,
  ...over,
});

describe('roundAed', () => {
  it('rounds to 2 decimals', () => {
    expect(roundAed(287.49999999999994)).toBe(287.5);
    expect(roundAed(10.004)).toBe(10);
    expect(roundAed(10.005)).toBe(10.01);
  });

  it('survives the float half-cent trap', () => {
    // Naive Math.round(1.005 * 100) / 100 returns 1, not 1.01.
    expect(roundAed(1.005)).toBe(1.01);
    expect(roundAed(2.675)).toBe(2.68);
  });

  it('returns 0 for non-finite input rather than propagating NaN into a money column', () => {
    expect(roundAed(NaN)).toBe(0);
    expect(roundAed(Infinity)).toBe(0);
  });
});

describe('applyMarkup', () => {
  it('applies a percentage', () => {
    expect(applyMarkup(100, 20)).toBe(120);
    expect(applyMarkup(850, 20)).toBe(1020);
  });

  it('treats 0% as a pass-through', () => {
    expect(applyMarkup(340, 0)).toBe(340);
  });

  it('allows a negative markup — a business may deliberately quote below cost', () => {
    expect(applyMarkup(100, -10)).toBe(90);
  });

  it('rounds the result to AED precision', () => {
    // 287.49999999999994 * 1.15 must not leak float noise into the row.
    expect(applyMarkup(287.49999999999994, 15)).toBe(330.63);
  });
});

describe('resolveMarkupPct', () => {
  it('inherited follows the quotation default', () => {
    expect(resolveMarkupPct({ price_mode: 'inherited', markup_percent: null }, 20)).toBe(20);
  });

  it('markup pins to the line and ignores the default', () => {
    expect(resolveMarkupPct({ price_mode: 'markup', markup_percent: 35 }, 20)).toBe(35);
  });

  it('manual has no percentage at all', () => {
    expect(resolveMarkupPct({ price_mode: 'manual', markup_percent: null }, 20)).toBeNull();
  });
});

describe('lineSellPrice', () => {
  it('derives inherited lines from the quotation default', () => {
    expect(lineSellPrice(line({ net_total_aed: 850 }), 20)).toBe(1020);
  });

  it('moves an inherited line when the default changes', () => {
    const l = line({ net_total_aed: 850 });
    expect(lineSellPrice(l, 20)).toBe(1020);
    expect(lineSellPrice(l, 30)).toBe(1105);
  });

  it('does NOT move a pinned line when the default changes', () => {
    const pinned = line({ net_total_aed: 850, price_mode: 'markup', markup_percent: 10 });
    expect(lineSellPrice(pinned, 20)).toBe(935);
    expect(lineSellPrice(pinned, 30)).toBe(935);
  });

  it('returns a manual override verbatim, whatever the default', () => {
    const manual = line({ net_total_aed: 850, sell_total_aed: 999, price_mode: 'manual' });
    expect(lineSellPrice(manual, 20)).toBe(999);
    expect(lineSellPrice(manual, 500)).toBe(999);
  });
});

describe('marginPct', () => {
  it('computes margin over net', () => {
    expect(marginPct(1000, 1200)).toBe(20);
    expect(marginPct(850, 1020)).toBe(20);
  });

  it('goes negative below cost', () => {
    expect(marginPct(1000, 900)).toBe(-10);
  });

  it('is undefined when net is zero', () => {
    expect(marginPct(0, 500)).toBeNull();
  });
});

describe('quotationTotals', () => {
  it('sums a multi-trip quotation', () => {
    const t = quotationTotals(
      [line({ net_total_aed: 850 }), line({ net_total_aed: 766.67 })],
      0,
      20
    );
    expect(t.subtotalNetAed).toBe(1616.67);
    expect(t.subtotalSellAed).toBe(1940);
    expect(t.totalSellAed).toBe(1940);
  });

  it('sums ROUNDED line prices so the printed column adds up to the printed total', () => {
    // Each line rounds to 33.34; three of them must total exactly 100.02, not 100.01.
    const lines = [
      line({ net_total_aed: 33.335 }),
      line({ net_total_aed: 33.335 }),
      line({ net_total_aed: 33.335 }),
    ];
    const t = quotationTotals(lines, 0, 0);
    const printedLines = lines.map((l) => lineSellPrice(l, 0));
    const printedSum = printedLines.reduce((a, b) => a + b, 0);
    expect(t.subtotalSellAed).toBe(roundAed(printedSum));
  });

  it('applies a discount', () => {
    const t = quotationTotals([line({ net_total_aed: 1000 })], 100, 20);
    expect(t.subtotalSellAed).toBe(1200);
    expect(t.discountAed).toBe(100);
    expect(t.totalSellAed).toBe(1100);
  });

  it('clamps a discount larger than the subtotal, which the DB CHECK would otherwise reject', () => {
    const t = quotationTotals([line({ net_total_aed: 100 })], 9999, 0);
    expect(t.discountAed).toBe(100);
    expect(t.totalSellAed).toBe(0);
  });

  it('ignores a negative discount', () => {
    const t = quotationTotals([line({ net_total_aed: 100 })], -50, 0);
    expect(t.discountAed).toBe(0);
    expect(t.totalSellAed).toBe(100);
  });

  it('satisfies the bq_total_consistent CHECK exactly', () => {
    const t = quotationTotals(
      [line({ net_total_aed: 333.33 }), line({ net_total_aed: 666.67 })],
      55.55,
      17.5
    );
    expect(t.totalSellAed).toBe(roundAed(t.subtotalSellAed - t.discountAed));
  });

  it('handles an empty quotation', () => {
    const t = quotationTotals([], 0, 20);
    expect(t.subtotalNetAed).toBe(0);
    expect(t.totalSellAed).toBe(0);
    expect(t.marginPct).toBeNull();
  });

  it('mixes inherited, pinned and manual lines correctly', () => {
    const t = quotationTotals(
      [
        line({ net_total_aed: 100 }),
        line({ net_total_aed: 100, price_mode: 'markup', markup_percent: 50 }),
        line({ net_total_aed: 100, sell_total_aed: 80, price_mode: 'manual' }),
      ],
      0,
      10
    );
    // 110 (inherited @10%) + 150 (pinned @50%) + 80 (manual) = 340
    expect(t.subtotalSellAed).toBe(340);
    expect(t.subtotalNetAed).toBe(300);
    expect(t.marginAed).toBe(40);
  });
});

describe('isBelowCost', () => {
  it('flags a loss-making line', () => {
    expect(isBelowCost(1000, 900)).toBe(true);
  });

  it('does not flag break-even', () => {
    expect(isBelowCost(1000, 1000)).toBe(false);
  });

  it('does not flag a profitable line', () => {
    expect(isBelowCost(1000, 1200)).toBe(false);
  });
});
