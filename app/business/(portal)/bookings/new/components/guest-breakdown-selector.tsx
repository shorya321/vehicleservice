'use client';

/**
 * Guest Breakdown Selector
 * Popover with Adults / Children / Infants steppers for business bookings.
 *
 * Seat semantics: adults + children consume seats; infants ride on a lap and
 * do not consume a seat. The seated total drives vehicle capacity filtering.
 */

import { ChevronDown, Minus, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface GuestBreakdown {
  adults: number;
  children: number;
  infants: number;
}

interface GuestBreakdownSelectorProps {
  value: GuestBreakdown;
  onChange: (value: GuestBreakdown) => void;
  maxSeated?: number;
  className?: string;
}

const MIN_ADULTS = 1;
const MIN_CHILDREN = 0;
const MIN_INFANTS = 0;

/**
 * Neutralizes the `outline` variant, which is a gold CTA in this repo (button.tsx), so the
 * steppers use the same neutral palette as the surrounding fields.
 */
const stepperButtonClass =
  'border border-border bg-background text-foreground hover:bg-muted hover:text-foreground';

/** Seats consumed. Infants ride on a lap and are excluded by design. */
export function getSeatedCount(value: GuestBreakdown): number {
  return value.adults + value.children;
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatGuestSummary(value: GuestBreakdown): string {
  const parts = [pluralize(value.adults, 'adult', 'adults')];

  if (value.children > 0) {
    parts.push(pluralize(value.children, 'child', 'children'));
  }

  const summary = parts.join(', ');

  return value.infants > 0
    ? `${summary} · ${pluralize(value.infants, 'infant', 'infants')}`
    : summary;
}

interface StepperRowProps {
  label: string;
  hint: string;
  value: number;
  min: number;
  onDecrement: () => void;
  onIncrement: () => void;
  incrementDisabled: boolean;
}

function StepperRow({
  label,
  hint,
  value,
  min,
  onDecrement,
  onIncrement,
  incrementDisabled,
}: StepperRowProps) {
  // Guard: this lives inside a react-hook-form <form>. Without type="button"
  // plus preventDefault/stopPropagation the steppers submit the Route form.
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (value > min) onDecrement();
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!incrementDisabled) onIncrement();
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn('h-8 w-8', stepperButtonClass)}
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="w-8 text-center font-medium tabular-nums">{value}</div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn('h-8 w-8', stepperButtonClass)}
          onClick={handleIncrement}
          disabled={incrementDisabled}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function GuestBreakdownSelector({
  value,
  onChange,
  maxSeated = 20,
  className,
}: GuestBreakdownSelectorProps) {
  const seated = getSeatedCount(value);
  const seatsFull = seated >= maxSeated;

  const update = (patch: Partial<GuestBreakdown>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-between font-normal',
            // The `outline` variant is a gold CTA in this repo (button.tsx). Neutralize its
            // colors to match the sibling fields (form-date-picker.tsx / input.tsx).
            'border border-border bg-background text-foreground',
            'hover:bg-muted/50 hover:text-foreground',
            'focus-visible:ring-primary focus-visible:border-primary focus-visible:ring-offset-0',
            // Match the sibling fields' box: size="default" is h-12 px-6, they are h-10 px-3.
            'h-10 px-3',
            className
          )}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{formatGuestSummary(value)}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-4" align="start">
        <StepperRow
          label="Adults"
          hint="Age 12+"
          value={value.adults}
          min={MIN_ADULTS}
          onDecrement={() => update({ adults: value.adults - 1 })}
          onIncrement={() => update({ adults: value.adults + 1 })}
          incrementDisabled={seatsFull}
        />
        <StepperRow
          label="Children"
          hint="Age 2–11 · needs a seat"
          value={value.children}
          min={MIN_CHILDREN}
          onDecrement={() => update({ children: value.children - 1 })}
          onIncrement={() => update({ children: value.children + 1 })}
          incrementDisabled={seatsFull}
        />
        <StepperRow
          label="Infants"
          hint="Under 2 · rides on lap"
          value={value.infants}
          min={MIN_INFANTS}
          onDecrement={() => update({ infants: value.infants - 1 })}
          onIncrement={() => update({ infants: value.infants + 1 })}
          incrementDisabled={value.infants >= value.adults}
        />

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Seats needed</span>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {seated}
          </span>
        </div>
        {value.infants > 0 && (
          <p className="text-xs text-muted-foreground -mt-2">
            Infants ride on a lap and do not use a seat.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
