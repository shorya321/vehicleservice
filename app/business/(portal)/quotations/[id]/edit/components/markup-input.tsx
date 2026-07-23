'use client';

/**
 * Per-line price control.
 *
 * Three modes, and the distinction between them is the whole UX:
 *   inherited - follows the quotation default and KEEPS following it as that default changes
 *   markup    - pinned to this line's own percentage
 *   manual    - a sell price typed directly; no percentage applies
 *
 * The "quotation default" badge is what makes cascading defaults comprehensible. Without it,
 * a line silently moving when someone edits the header default is infuriating to debug.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
// Portal money format ("AED 150.00"); the customer PDF keeps formatAmount.
import { formatCurrency } from '@/lib/business/wallet-operations';
import {
  applyMarkup,
  marginPct,
  isBelowCost,
  roundAed,
  type QuotationPriceMode,
} from '@/lib/business/quotations/pricing';

interface MarkupInputProps {
  netAed: number;
  sellAed: number;
  priceMode: QuotationPriceMode;
  markupPercent: number | null;
  defaultMarkupPct: number;
  currency: string;
  exchangeRate: number;
  onChange: (update: {
    price_mode: QuotationPriceMode;
    markup_percent: number | null;
    sell_total_aed: number;
  }) => void;
}

export function MarkupInput({
  netAed,
  sellAed,
  priceMode,
  markupPercent,
  defaultMarkupPct,
  currency,
  exchangeRate,
  onChange,
}: MarkupInputProps) {
  const effectivePct =
    priceMode === 'manual'
      ? null
      : priceMode === 'markup'
        ? markupPercent ?? 0
        : defaultMarkupPct;

  // An inherited line derives live from the default; a manual one keeps what was typed.
  const displaySell =
    priceMode === 'manual' ? roundAed(sellAed) : applyMarkup(netAed, effectivePct ?? 0);

  const margin = marginPct(netAed, displaySell);
  const belowCost = isBelowCost(netAed, displaySell);

  function setPercent(value: string) {
    const pct = Number(value);
    if (!Number.isFinite(pct)) return;
    // Typing a percentage PINS the line — it stops tracking the quotation default.
    onChange({
      price_mode: 'markup',
      markup_percent: pct,
      sell_total_aed: applyMarkup(netAed, pct),
    });
  }

  function setSell(value: string) {
    const price = Number(value);
    if (!Number.isFinite(price) || price < 0) return;
    onChange({ price_mode: 'manual', markup_percent: null, sell_total_aed: roundAed(price) });
  }

  function resetToDefault() {
    onChange({
      price_mode: 'inherited',
      markup_percent: null,
      sell_total_aed: applyMarkup(netAed, defaultMarkupPct),
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Cost</span>
        <span className="tabular-nums">{formatCurrency(netAed, 'AED')}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="markup-pct">Markup %</Label>
          <Input
            id="markup-pct"
            type="number"
            step="0.1"
            value={effectivePct ?? ''}
            placeholder={priceMode === 'manual' ? 'n/a' : undefined}
            disabled={priceMode === 'manual'}
            onChange={(e) => setPercent(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sell-price">Sell price (AED)</Label>
          <Input
            id="sell-price"
            type="number"
            step="0.01"
            min="0"
            value={displaySell}
            onChange={(e) => setSell(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {priceMode === 'inherited' && (
          <Badge variant="secondary" className="font-normal">
            {defaultMarkupPct}% — quotation default
          </Badge>
        )}
        {priceMode === 'markup' && (
          <>
            <Badge variant="outline" className="font-normal">
              Pinned to this trip
            </Badge>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={resetToDefault}>
              Reset to default
            </Button>
          </>
        )}
        {priceMode === 'manual' && (
          <>
            <Badge variant="outline" className="font-normal">
              Manual price
            </Badge>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={resetToDefault}>
              Reset to default
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
        <span className="text-muted-foreground">
          Margin{margin !== null ? ` (${margin}%)` : ''}
        </span>
        <span className="tabular-nums">{formatCurrency(displaySell - netAed, 'AED')}</span>
      </div>

      {belowCost && (
        <p className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          This trip sells below cost.
        </p>
      )}

      {currency !== 'AED' && (
        <p className="text-xs text-muted-foreground">
          Customer sees {formatCurrency(displaySell * exchangeRate, currency)} at the locked rate.
        </p>
      )}
    </div>
  );
}
