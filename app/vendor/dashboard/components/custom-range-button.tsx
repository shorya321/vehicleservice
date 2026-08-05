'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { bookingToday } from '@/lib/utils/timezone'

interface CustomRangeButtonProps {
  active: boolean
  /** Text shown on the pill: "Custom" when inactive, the range summary when active. */
  label: string
  /** Called with inclusive Dubai calendar days (`yyyy-MM-dd`). */
  onApply: (from: string, to: string) => void
  disabled?: boolean
}

/** The calendar speaks in local Date objects; callers speak in Dubai days. */
function parseDay(day: string | undefined): Date | undefined {
  if (!day) return undefined
  const parsed = new Date(`${day.slice(0, 10)}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

/**
 * A "Custom" pill that opens a 2-month range calendar. Local draft state only,
 * no URL, so each chart keeps its own independent range.
 */
export function CustomRangeButton({ active, label, onApply, disabled }: CustomRangeButtonProps) {
  const [open, setOpen] = useState(false)
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined)

  // Last selectable day in Dubai terms. Completed work never exists in the
  // future, and browser-local midnight would let a future Dubai day through.
  const lastSelectableDay = parseDay(bookingToday())

  const handleOpenChange = (next: boolean) => {
    // Clear the draft on every open so a stale selection never lingers.
    if (next) setDraftRange(undefined)
    setOpen(next)
  }

  const handleApply = () => {
    if (!draftRange?.from) return
    // Plain Dubai calendar days. An ISO instant here would be the viewer's
    // local midnight, which shifts day boundaries per browser timezone.
    const from = format(draftRange.from, 'yyyy-MM-dd')
    // A single click leaves `to` empty; that means one day, not open-ended.
    const to = format(draftRange.to ?? draftRange.from, 'yyyy-MM-dd')
    onApply(from, to)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'admin-period-btn',
            active ? 'admin-period-btn-active' : 'admin-period-btn-inactive'
          )}
          disabled={disabled}
        >
          {active ? label : 'Custom'}
        </button>
      </PopoverTrigger>
      <PopoverContent
        // A 2-month calendar is taller than the space below the trigger, so
        // Radix flips it upward. Cap the height so it can never run past the
        // viewport edge whichever way it opens.
        className="luxury-calendar-popover max-h-[80vh] w-auto overflow-y-auto p-0"
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
      >
        <Calendar
          autoFocus
          mode="range"
          defaultMonth={lastSelectableDay}
          endMonth={lastSelectableDay}
          disabled={lastSelectableDay ? { after: lastSelectableDay } : undefined}
          selected={draftRange}
          onSelect={setDraftRange}
          numberOfMonths={2}
        />
        <div className="flex items-center justify-between border-t p-3">
          <Button variant="ghost" size="sm" onClick={() => setDraftRange(undefined)}>
            Reset
          </Button>
          <Button size="sm" onClick={handleApply} disabled={!draftRange?.from}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
