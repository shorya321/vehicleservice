'use client';

/**
 * Extras for one quotation trip.
 *
 * Its own component rather than a reuse of the booking wizard's AddonSelection: that one is a
 * controlled React-Hook-Form-adjacent card grid, while the trip editor is a plain useState draft
 * inside a sheet. The quotations module also keeps its own copies of the guest and addon reads for
 * the same reason — a change to the wizard must never silently alter quotations.
 *
 * Only the action FUNCTION is imported from the quotations actions module — never its types
 * (that file is 'use server', and a type exported from one breaks at runtime while tsc stays
 * silent). Shapes come from lib/business/quotations/types.
 */

import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/business/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { getQuotationAddonOptions } from '../../../actions';
import { childSeatFitHint } from '@/lib/business/child-seat-fit';
import type { QuotationAddonOption, QuotationItemAddon } from '@/lib/business/quotations/types';

/** 0 renders as "Under 1". 12 is the ceiling — adults start at 12 in the guest wording. */
const CHILD_AGE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function ageLabel(age: number): string {
  if (age === 0) return 'Under 1';
  return `${age} year${age === 1 ? '' : 's'}`;
}

/** Grow with nulls / truncate so the ages array always has exactly `quantity` entries. */
function resizeAges(existing: (number | null)[] | undefined, quantity: number): (number | null)[] {
  const next = (existing ?? []).slice(0, quantity);
  while (next.length < quantity) next.push(null);
  return next;
}

/**
 * A draft addon while the sheet is open: ages may still be null. `QuotationItemAddon` (what gets
 * persisted) requires them filled, which `addonsReadyToSave` below asserts before saving.
 */
export interface DraftAddon extends Omit<QuotationItemAddon, 'child_ages'> {
  child_ages?: (number | null)[] | null;
  requires_child_age?: boolean;
}

/**
 * True when every child seat on the trip has an age — the sheet gates Save on this.
 *
 * `requires_child_age` is a client-only hint and is deliberately NOT persisted, so a trip reloaded
 * for editing arrives without it. A stored child seat is recognised by its non-null `child_ages`
 * instead; anything the operator then touches is rebuilt from the catalogue and regains the flag.
 */
export function addonsReadyToSave(addons: DraftAddon[]): boolean {
  return addons.every((a) => {
    const isSeat = a.requires_child_age || a.child_ages != null;
    if (!isSeat) return true;
    return (
      (a.child_ages?.length ?? 0) === a.quantity &&
      (a.child_ages ?? []).every((v) => v !== null)
    );
  });
}

/** Strip the draft-only fields and the nulls, ready for the zod schema and the DB. */
export function toPersistableAddons(addons: DraftAddon[]): QuotationItemAddon[] {
  return addons.map((a) => ({
    addon_id: a.addon_id,
    name_snapshot: a.name_snapshot,
    quantity: a.quantity,
    unit_price: a.unit_price,
    total_price: a.total_price,
    child_ages: a.child_ages
      ? (a.child_ages.filter((v): v is number => v !== null) as number[])
      : null,
  }));
}

interface AddonPickerProps {
  value: DraftAddon[];
  onChange: (addons: DraftAddon[]) => void;
  /** children + infants on this trip. Child seats are capped at this, and hidden when it is 0. */
  childSeatCapacity: number;
  disabled?: boolean;
}

export function AddonPicker({ value, onChange, childSeatCapacity, disabled }: AddonPickerProps) {
  const [options, setOptions] = useState<QuotationAddonOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getQuotationAddonOptions()
      .then((res) => {
        if (!cancelled) setOptions(res.addons);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedById = useMemo(
    () => new Map(value.map((a) => [a.addon_id, a])),
    [value]
  );

  /**
   * Read the requirement from the CATALOGUE, not from the draft entry.
   *
   * `requires_child_age` is a client-only hint that is never persisted, so a reloaded trip has it
   * unset — counting on the entry made the cap read "0 of 2" after a reload and let the operator
   * add more seats than the trip has children.
   */
  const requiresAge = (addonId: string) =>
    options.find((o) => o.id === addonId)?.requires_child_age ?? false;

  const ageSeatsSelected = value
    .filter((a) => requiresAge(a.addon_id))
    .reduce((n, a) => n + a.quantity, 0);

  /** Candidates the fit hint can suggest instead, in display_order. */
  const ageRequiringOptions = options.filter((o) => o.requires_child_age);

  /** max_quantity is nullable in the DB; null means "no per-addon cap", not zero. */
  const addonMax = (o: QuotationAddonOption) => o.max_quantity ?? Number.MAX_SAFE_INTEGER;

  const effectiveMax = (o: QuotationAddonOption, currentQty: number) =>
    o.requires_child_age
      ? Math.min(addonMax(o), currentQty + Math.max(0, childSeatCapacity - ageSeatsSelected))
      : addonMax(o);

  const setQuantity = (o: QuotationAddonOption, quantity: number) => {
    if (quantity <= 0) {
      onChange(value.filter((a) => a.addon_id !== o.id));
      return;
    }
    const current = selectedById.get(o.id);
    if (quantity > effectiveMax(o, current?.quantity ?? 0)) return;

    const next: DraftAddon = {
      addon_id: o.id,
      name_snapshot: o.name,
      quantity,
      unit_price: o.price,
      // Rounded the same way bqia_total does, or the DB CHECK rejects the row.
      total_price: Math.round(o.price * quantity * 100) / 100,
      ...(o.requires_child_age
        ? { child_ages: resizeAges(current?.child_ages ?? undefined, quantity), requires_child_age: true }
        : {}),
    };

    onChange(
      current
        ? value.map((a) => (a.addon_id === o.id ? next : a))
        : [...value, next]
    );
  };

  const setChildAge = (addonId: string, index: number, age: number | null) => {
    onChange(
      value.map((a) => {
        if (a.addon_id !== addonId) return a;
        const ages = resizeAges(a.child_ages ?? undefined, a.quantity);
        ages[index] = age;
        return { ...a, child_ages: ages };
      })
    );
  };

  // Prune seats that no longer fit the budget when guests are reduced. Derived rather than
  // written back from an effect, so it also holds on the very first render.
  useEffect(() => {
    if (ageSeatsSelected <= childSeatCapacity) return;
    let budget = childSeatCapacity;
    const trimmed: DraftAddon[] = [];
    for (const a of value) {
      // Looked up inline rather than via requiresAge(): that closure is rebuilt every render, so
      // depending on it here would re-run this effect constantly.
      const isSeat = options.find((o) => o.id === a.addon_id)?.requires_child_age ?? false;
      if (!isSeat) {
        trimmed.push(a);
        continue;
      }
      const q = Math.min(a.quantity, budget);
      budget -= q;
      if (q <= 0) continue;
      trimmed.push(
        q === a.quantity
          ? a
          : {
              ...a,
              quantity: q,
              total_price: Math.round(a.unit_price * q * 100) / 100,
              child_ages: resizeAges(a.child_ages ?? undefined, q),
            }
      );
    }
    onChange(trimmed);
  }, [childSeatCapacity, ageSeatsSelected, value, onChange, options]);

  const grouped = useMemo(() => {
    const visible =
      childSeatCapacity > 0 ? options : options.filter((o) => !o.requires_child_age);
    const byCategory = new Map<string, QuotationAddonOption[]>();
    for (const o of visible) {
      const list = byCategory.get(o.category) ?? [];
      list.push(o);
      byCategory.set(o.category, list);
    }
    const order = ['Child Safety', 'Luggage', 'Comfort'];
    const out: Array<{ category: string; addons: QuotationAddonOption[] }> = [];
    for (const cat of order) {
      if (byCategory.has(cat)) out.push({ category: cat, addons: byCategory.get(cat)! });
    }
    byCategory.forEach((addons, category) => {
      if (!order.includes(category)) out.push({ category, addons });
    });
    return out;
  }, [options, childSeatCapacity]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading extras…</p>;
  }

  if (grouped.length === 0) {
    return <p className="text-sm text-muted-foreground">No extras available.</p>;
  }

  return (
    <div className="space-y-5">
      {grouped.map((group) => {
        const isSeatGroup = group.addons.every((o) => o.requires_child_age);
        return (
          <div key={group.category} className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.category}
              </p>
              {isSeatGroup && (
                <span className="text-xs text-muted-foreground">
                  {ageSeatsSelected} of {childSeatCapacity} seat
                  {childSeatCapacity === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {group.addons.map((o) => {
              const selected = selectedById.get(o.id);
              const quantity = selected?.quantity ?? 0;
              return (
                <div
                  key={o.id}
                  className={cn(
                    'rounded-lg border p-3',
                    quantity > 0 ? 'border-primary/40 bg-primary/5' : 'border-border'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{o.name}</p>
                      {o.description && (
                        <p className="truncate text-xs text-muted-foreground">{o.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant="outline" className="whitespace-nowrap">
                        {formatCurrency(o.price)}
                        {o.pricing_type === 'per_unit' ? '/ea' : ''}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          disabled={disabled || quantity === 0}
                          aria-label={`Decrease ${o.name}`}
                          onClick={() => setQuantity(o, quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-center text-sm tabular-nums">{quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          disabled={
                            disabled ||
                            quantity >= effectiveMax(o, quantity) ||
                            (o.pricing_type === 'fixed' && quantity >= 1)
                          }
                          aria-label={`Increase ${o.name}`}
                          onClick={() => setQuantity(o, quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {o.requires_child_age && selected && (
                    <div className="mt-3 grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-2">
                      {resizeAges(selected.child_ages ?? undefined, selected.quantity).map(
                        (age, i) => {
                          // Advisory only — options stay 0-12 so a mismatch stays visible.
                          const fitHint = childSeatFitHint(age, o, ageRequiringOptions);
                          return (
                            <label key={i} className="flex flex-col gap-1">
                              <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                                {selected.quantity > 1 ? `Child ${i + 1} age` : 'Child age'}
                              </span>
                              <select
                                className={cn(
                                  'h-9 rounded-md border bg-background px-2 text-sm text-foreground',
                                  age === null ? 'border-destructive' : 'border-input'
                                )}
                                value={age === null ? '' : String(age)}
                                aria-invalid={age === null}
                                aria-label={`Child ${i + 1} age for ${o.name}`}
                                disabled={disabled}
                                onChange={(e) =>
                                  setChildAge(
                                    o.id,
                                    i,
                                    e.target.value === '' ? null : Number(e.target.value)
                                  )
                                }
                              >
                                <option value="">Select age</option>
                                {CHILD_AGE_OPTIONS.map((a) => (
                                  <option key={a} value={a}>
                                    {ageLabel(a)}
                                  </option>
                                ))}
                              </select>
                              {fitHint && (
                                <span className="text-[0.65rem] leading-tight text-amber-600 dark:text-amber-500">
                                  {fitHint}
                                </span>
                              )}
                            </label>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
