'use client';

/**
 * One way / Round trip / Multi-city / Hourly switch at the top of the Route step.
 * SCOPE: Business module ONLY.
 */

import { ArrowRight, ArrowLeftRight, Route, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BUSINESS_TRIP_TYPE_LABELS } from '@/lib/business/trips/constants';
import type { BusinessTripType } from '@/lib/business/trips/types';

const ICONS: Record<BusinessTripType, typeof ArrowRight> = {
  one_way: ArrowRight,
  round_trip: ArrowLeftRight,
  multi_city: Route,
  hourly: Clock,
};

interface TripTypeTabsProps {
  value: BusinessTripType;
  options: BusinessTripType[];
  onChange: (value: BusinessTripType) => void;
  disabled?: boolean;
}

export function TripTypeTabs({ value, options, onChange, disabled }: TripTypeTabsProps) {
  if (options.length <= 1) return null;

  return (
    <div role="tablist" aria-label="Trip type" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((option) => {
        const Icon = ICONS[option];
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50',
              selected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {BUSINESS_TRIP_TYPE_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
