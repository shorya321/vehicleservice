'use client';

/**
 * Addon Selection Component
 * Allows selecting addons for business bookings
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Minus, Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { AddonItem, AddonsByCategory } from '../actions';
import { childSeatFitHint } from '@/lib/business/child-seat-fit';

export interface SelectedAddon {
  addon_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  /**
   * One entry per selected unit; `null` until an age is chosen. Present only on addons whose
   * `requires_child_age` is set. The API re-derives the requirement from the DB.
   */
  child_ages?: (number | null)[];
  /** Rendering hint only. The API reads the flag from the addons table. */
  requires_child_age?: boolean;
}

interface AddonSelectionProps {
  addonsByCategory: AddonsByCategory[];
  selectedAddons: SelectedAddon[];
  onAddonsChange: (addons: SelectedAddon[]) => void;
  /**
   * children + infants from the Route step. Child seats can never outnumber them, and the whole
   * child-seat group is hidden when this is 0.
   */
  childSeatCapacity: number;
}

/** 0 renders as "Under 1". 12 is the ceiling. The guest picker labels adults as "Age 12+". */
const CHILD_AGE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function ageLabel(age: number): string {
  if (age === 0) return 'Under 1';
  return `${age} year${age === 1 ? '' : 's'}`;
}

/** Grow with `null`s / truncate so the ages array always has exactly `quantity` entries. */
function resizeAges(existing: (number | null)[] | undefined, quantity: number): (number | null)[] {
  const next = (existing ?? []).slice(0, quantity);
  while (next.length < quantity) next.push(null);
  return next;
}

/** True when every child seat selected has an age chosen. The wizard gates "Confirm" on this. */
export function childAgesComplete(selectedAddons: SelectedAddon[]): boolean {
  return selectedAddons.every(
    (s) =>
      !s.requires_child_age ||
      ((s.child_ages?.length ?? 0) === s.quantity && s.child_ages!.every((a) => a !== null))
  );
}

// Dynamic icon component
function AddonIcon({ iconName }: { iconName: string }) {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
  if (!IconComponent) return null;
  return <IconComponent className="h-5 w-5" />;
}

export function AddonSelection({
  addonsByCategory,
  selectedAddons,
  onAddonsChange,
  childSeatCapacity,
}: AddonSelectionProps) {
  const prefersReducedMotion = useReducedMotion();

  // Helper to get selected addon
  const getSelectedAddon = (addonId: string) => {
    return selectedAddons.find((s) => s.addon_id === addonId);
  };

  /** max_quantity is nullable in the DB; null means "no per-addon cap", NOT zero. */
  const addonMax = (addon: AddonItem) =>
    addon.max_quantity ?? Number.MAX_SAFE_INTEGER;

  const ageSeatsSelected = selectedAddons
    .filter((s) => s.requires_child_age)
    .reduce((n, s) => n + s.quantity, 0);

  /**
   * A child seat is capped twice: by its own admin-configured max_quantity, and by whatever is
   * left of the shared children+infants budget once the other seats are counted.
   */
  const effectiveMax = (addon: AddonItem, currentQty: number) =>
    addon.requires_child_age
      ? Math.min(addonMax(addon), currentQty + Math.max(0, childSeatCapacity - ageSeatsSelected))
      : addonMax(addon);

  // Toggle fixed-price addon
  const toggleAddon = (addon: AddonItem) => {
    const existing = getSelectedAddon(addon.id);
    if (existing) {
      // Remove
      onAddonsChange(selectedAddons.filter((s) => s.addon_id !== addon.id));
    } else {
      // A fixed addon is always quantity 1, so it needs one free seat in the budget.
      if (addon.requires_child_age && ageSeatsSelected >= childSeatCapacity) return;
      onAddonsChange([
        ...selectedAddons,
        {
          addon_id: addon.id,
          quantity: 1,
          unit_price: addon.price,
          total_price: addon.price,
          ...(addon.requires_child_age
            ? { child_ages: resizeAges(undefined, 1), requires_child_age: true }
            : {}),
        },
      ]);
    }
  };

  // Update quantity for per-unit addon
  const updateQuantity = (addon: AddonItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove
      onAddonsChange(selectedAddons.filter((s) => s.addon_id !== addon.id));
    } else if (newQuantity > effectiveMax(addon, getSelectedAddon(addon.id)?.quantity ?? 0)) {
      // Over the cap. A no-op rather than a silent rewrite into a different order.
      return;
    } else {
      const existing = getSelectedAddon(addon.id);
      const ageFields = addon.requires_child_age
        ? { child_ages: resizeAges(existing?.child_ages, newQuantity), requires_child_age: true }
        : {};
      if (existing) {
        // Update
        onAddonsChange(
          selectedAddons.map((s) =>
            s.addon_id === addon.id
              ? { ...s, quantity: newQuantity, total_price: addon.price * newQuantity, ...ageFields }
              : s
          )
        );
      } else {
        // Add new
        onAddonsChange([
          ...selectedAddons,
          {
            addon_id: addon.id,
            quantity: newQuantity,
            unit_price: addon.price,
            total_price: addon.price * newQuantity,
            ...ageFields,
          },
        ]);
      }
    }
  };

  const setChildAge = (addon: AddonItem, index: number, age: number | null) => {
    onAddonsChange(
      selectedAddons.map((s) => {
        if (s.addon_id !== addon.id) return s;
        const ages = resizeAges(s.child_ages, s.quantity);
        ages[index] = age;
        return { ...s, child_ages: ages };
      })
    );
  };

  // Calculate total
  const totalAddonsPrice = selectedAddons.reduce((sum, s) => sum + s.total_price, 0);

  // With no children or infants on the booking there is nothing a child seat could be for, so the
  // whole group is hidden rather than shown as permanently unusable.
  const visibleCategories =
    childSeatCapacity > 0
      ? addonsByCategory
      : addonsByCategory
          .map((c) => ({ ...c, addons: c.addons.filter((a) => !a.requires_child_age) }))
          .filter((c) => c.addons.length > 0);

  // Candidates the fit hint can suggest instead, in display_order.
  const ageRequiringAddons = addonsByCategory
    .flatMap((c) => c.addons)
    .filter((a) => a.requires_child_age);

  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Addon Categories */}
      {visibleCategories.map((category) => (
        <div key={category.category} className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h4 className="text-sm font-medium text-muted-foreground">{category.category}</h4>
            {category.addons.every((a) => a.requires_child_age) && (
              <span className="text-xs text-muted-foreground">
                {ageSeatsSelected} of {childSeatCapacity} seat
                {childSeatCapacity === 1 ? '' : 's'} · one per child or infant
              </span>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.addons.map((addon) => {
              const selected = getSelectedAddon(addon.id);
              const isSelected = !!selected;
              const quantity = selected?.quantity || 0;
              const isFree = addon.price === 0;

              return (
                <motion.div
                  key={addon.id}
                  whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                  className={cn(
                    'relative flex flex-col rounded-xl border p-4 transition-all cursor-pointer card-hover',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-md'
                  )}
                  onClick={() => {
                    if (addon.pricing_type === 'fixed') {
                      toggleAddon(addon);
                    }
                  }}
                >
                  {/* Selection indicator */}
                  <div
                    className={cn(
                      'absolute top-3 right-3 h-5 w-5 rounded-full flex items-center justify-center transition-colors',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>

                  {/* Icon and name */}
                  <div className="flex items-start gap-3 mb-2 pr-6">
                    <motion.div
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0',
                        isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <AddonIcon iconName={addon.icon} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{addon.name}</p>
                      {addon.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {addon.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price and quantity controls */}
                  <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/50">
                    {addon.pricing_type === 'fixed' ? (
                      <Badge variant={isFree ? 'secondary' : 'outline'}>
                        {isFree ? 'Free' : formatCurrency(addon.price)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {formatCurrency(addon.price)}/ea
                      </Badge>
                    )}

                    {addon.pricing_type === 'per_unit' && (
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(addon, quantity - 1)}
                          disabled={quantity === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(addon, quantity + 1)}
                          disabled={quantity >= effectiveMax(addon, quantity)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* One age per seat, shown once a child seat is selected. */}
                  {addon.requires_child_age && selected && (
                    <div
                      className="mt-3 pt-3 border-t border-border/50 grid gap-2 sm:grid-cols-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {resizeAges(selected.child_ages, selected.quantity).map((value, i) => {
                        // Advisory only. Options stay 0-12 so a mismatch stays visible.
                        const fitHint = childSeatFitHint(value, addon, ageRequiringAddons);
                        return (
                          <label key={i} className="flex flex-col gap-1">
                            <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                              {selected.quantity > 1 ? `Child ${i + 1} age` : 'Child age'}
                            </span>
                            <select
                              className={cn(
                                'h-9 rounded-md border bg-background px-2 text-sm text-foreground',
                                value === null ? 'border-destructive' : 'border-input'
                              )}
                              value={value === null ? '' : String(value)}
                              aria-invalid={value === null}
                              aria-label={`Child ${i + 1} age for ${addon.name}`}
                              onChange={(e) =>
                                setChildAge(addon, i, e.target.value === '' ? null : Number(e.target.value))
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
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Addons Total */}
      {totalAddonsPrice > 0 && (
        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50 border border-border">
          <span className="text-sm text-muted-foreground">Selected Addons Total:</span>
          <span className="font-semibold text-primary">{formatCurrency(totalAddonsPrice)}</span>
        </div>
      )}
    </div>
  );
}
