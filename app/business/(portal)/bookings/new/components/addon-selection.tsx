'use client';

/**
 * Addon Selection Component
 * Allows selecting addons for business bookings
 */

import { useState, useEffect } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { AddonItem, AddonsByCategory } from '../actions';

export interface SelectedAddon {
  addon_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface AddonSelectionProps {
  addonsByCategory: AddonsByCategory[];
  selectedAddons: SelectedAddon[];
  onAddonsChange: (addons: SelectedAddon[]) => void;
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
}: AddonSelectionProps) {
  // Helper to get selected addon
  const getSelectedAddon = (addonId: string) => {
    return selectedAddons.find((s) => s.addon_id === addonId);
  };

  // Toggle fixed-price addon
  const toggleAddon = (addon: AddonItem) => {
    const existing = getSelectedAddon(addon.id);
    if (existing) {
      // Remove
      onAddonsChange(selectedAddons.filter((s) => s.addon_id !== addon.id));
    } else {
      // Add
      onAddonsChange([
        ...selectedAddons,
        {
          addon_id: addon.id,
          quantity: 1,
          unit_price: addon.price,
          total_price: addon.price,
        },
      ]);
    }
  };

  // Update quantity for per-unit addon
  const updateQuantity = (addon: AddonItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove
      onAddonsChange(selectedAddons.filter((s) => s.addon_id !== addon.id));
    } else if (newQuantity > addon.max_quantity) {
      // Cap at max
      return;
    } else {
      const existing = getSelectedAddon(addon.id);
      if (existing) {
        // Update
        onAddonsChange(
          selectedAddons.map((s) =>
            s.addon_id === addon.id
              ? { ...s, quantity: newQuantity, total_price: addon.price * newQuantity }
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
          },
        ]);
      }
    }
  };

  // Calculate total
  const totalAddonsPrice = selectedAddons.reduce((sum, s) => sum + s.total_price, 0);

  if (addonsByCategory.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Addon Categories */}
      {addonsByCategory.map((category) => (
        <div key={category.category} className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">{category.category}</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.addons.map((addon) => {
              const selected = getSelectedAddon(addon.id);
              const isSelected = !!selected;
              const quantity = selected?.quantity || 0;
              const isFree = addon.price === 0;

              return (
                <div
                  key={addon.id}
                  className={cn(
                    'relative flex flex-col rounded-xl border p-4 transition-all cursor-pointer',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
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
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0',
                      isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      <AddonIcon iconName={addon.icon} />
                    </div>
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
                          disabled={quantity >= addon.max_quantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
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
