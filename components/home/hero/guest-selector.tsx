'use client'

/**
 * Guests picker for the home-page hero search.
 *
 * Adults / Children / Infants steppers in a popover, mirroring the hero's date field so it looks
 * native (same `.search-bar-date-trigger` + `.luxury-calendar-popover` classes).
 *
 * NOTE: the business portal has its own equivalent at
 * `app/business/(portal)/bookings/new/components/guest-breakdown-selector.tsx`. The two are kept
 * separate on purpose — the business module is independent of the customer flow and is themed for
 * shadcn, not the luxury CSS vars used here.
 */

import { Minus, Plus, Users } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatGuestSummary, getSeatedCount, type GuestBreakdown } from './guest-breakdown'

const MAX_SEATED = 20
/** Mirrors the child-seat stock: every infant needs a seat and only four are carried. */
const MAX_INFANTS = 4

const MIN_ADULTS = 1

interface GuestSelectorProps {
  value: GuestBreakdown
  onChange: (value: GuestBreakdown) => void
  /**
   * Seat ceiling. The hero has no vehicle yet so it uses the fleet-wide default; checkout passes the
   * chosen vehicle's `passenger_capacity`.
   */
  maxSeated?: number
  className?: string
}

interface StepperRowProps {
  label: string
  hint: string
  value: number
  min: number
  onDecrement: () => void
  onIncrement: () => void
  incrementDisabled: boolean
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
  // This popover lives inside the hero's <form onSubmit={handleSearch}>. Without type="button" and
  // preventDefault/stopPropagation, every stepper click would submit the search.
  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (value > min) onDecrement()
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!incrementDisabled) onIncrement()
  }

  const buttonClass =
    'flex h-8 w-8 items-center justify-center rounded-md border border-[var(--graphite)] text-[var(--text-primary)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--charcoal)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--graphite)] disabled:hover:bg-transparent'

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          className={buttonClass}
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <span className="w-8 text-center text-sm font-medium tabular-nums text-[var(--text-primary)]">
          {value}
        </span>
        <button
          type="button"
          className={buttonClass}
          onClick={handleIncrement}
          disabled={incrementDisabled}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

export function GuestSelector({
  value,
  onChange,
  maxSeated = MAX_SEATED,
  className,
}: GuestSelectorProps) {
  const seated = getSeatedCount(value)
  const seatsFull = seated >= maxSeated

  const update = (patch: Partial<GuestBreakdown>) => {
    onChange({ ...value, ...patch })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          id="guests"
          type="button"
          className={className ?? 'search-bar-input search-bar-date-trigger'}
          aria-label="Select guests"
        >
          <Users
            className="w-4 h-4 shrink-0 text-[var(--text-muted)]"
            aria-hidden
          />
          <span className="truncate">{formatGuestSummary(value)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="luxury-calendar-popover w-80 space-y-4 p-4"
        align="start"
        sideOffset={8}
      >
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
          min={0}
          onDecrement={() => update({ children: value.children - 1 })}
          onIncrement={() => update({ children: value.children + 1 })}
          incrementDisabled={seatsFull}
        />
        <StepperRow
          label="Infants"
          hint="Under 2 · needs a car seat"
          value={value.infants}
          min={0}
          onDecrement={() => update({ infants: value.infants - 1 })}
          onIncrement={() => update({ infants: value.infants + 1 })}
          incrementDisabled={seatsFull || value.infants >= MAX_INFANTS}
        />

        <div className="flex items-center justify-between border-t border-[var(--graphite)] pt-3">
          <span className="text-xs text-[var(--text-muted)]">Seats needed</span>
          <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
            {seated}
          </span>
        </div>
        {value.children + value.infants > 0 && (
          <p className="-mt-2 text-xs text-[var(--text-muted)]">
            Child seats are included free — just ask when you book.
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
