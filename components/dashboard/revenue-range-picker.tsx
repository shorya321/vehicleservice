'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { bookingToday } from '@/lib/utils/timezone'
import type { RevenueRange } from '@/lib/dashboard/revenue-range'

interface RevenueRangePickerProps {
  range: RevenueRange
}

const PERIOD_PILLS = [
  { preset: 'last7d', label: 'Daily' },
  { preset: 'last8w', label: 'Weekly' },
  { preset: 'last12m', label: 'Monthly' },
]

/** The calendar speaks in local Date objects; the URL speaks in Dubai days. */
function parseDay(day: string | undefined): Date | undefined {
  if (!day) return undefined
  const parsed = new Date(`${day.slice(0, 10)}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

/** Compact range summary for the Custom pill, e.g. "8 Jul – 17 Jul". */
function summariseRange(range: RevenueRange): string {
  const from = parseDay(range.from)
  const to = parseDay(range.to)
  if (!from || !to) return 'Custom'

  const pattern = range.crossesYear ? 'd MMM yy' : 'd MMM'
  return `${format(from, pattern)} – ${format(to, pattern)}`
}

export function RevenueRangePicker({ range }: RevenueRangePickerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [calendarOpen, setCalendarOpen] = useState(false)
  // Starts empty and is cleared on every open: pre-filling it with the active
  // preset meant opening Custom from Monthly arrived with a 12-month range
  // already selected. Resetting on open also avoids a stale draft, since
  // router.replace re-renders this component without remounting it.
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined)

  // Last selectable day in Dubai terms — booked revenue never exists after
  // today, and browser-local midnight would let a future Dubai day through.
  const lastSelectableDay = parseDay(bookingToday())

  // Any preset without a pill (a stale `?preset=ytd` or `year:2026` URL) is
  // still a concrete range, so surface it on the Custom pill rather than
  // leaving the whole group unhighlighted.
  const isCustom = !PERIOD_PILLS.some((pill) => pill.preset === range.preset)

  const handleCalendarOpenChange = (open: boolean) => {
    if (open) setDraftRange(undefined)
    setCalendarOpen(open)
  }

  const pushParams = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString())
    mutate(params)
    startTransition(() => {
      // replace, not push — switching range shouldn't fill the back button.
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const handlePresetClick = (preset: string) => {
    if (preset === range.preset) return
    pushParams((params) => {
      params.set('preset', preset)
      // A preset defines its own window; stale from/to would override it.
      params.delete('from')
      params.delete('to')
    })
  }

  const handleApplyCustomRange = () => {
    if (!draftRange?.from) return
    // Plain Dubai calendar days — an ISO instant here would be the admin's
    // local midnight, which shifts day boundaries per browser timezone.
    const from = format(draftRange.from, 'yyyy-MM-dd')
    // A single click leaves `to` empty; that means one day, not open-ended.
    const to = format(draftRange.to ?? draftRange.from, 'yyyy-MM-dd')

    pushParams((params) => {
      params.set('from', from)
      params.set('to', to)
      params.delete('preset')
    })
    setCalendarOpen(false)
  }

  return (
    <div className="admin-period-selector">
      {PERIOD_PILLS.map((pill) => (
        <button
          key={pill.preset}
          type="button"
          className={cn(
            'admin-period-btn',
            range.preset === pill.preset
              ? 'admin-period-btn-active'
              : 'admin-period-btn-inactive'
          )}
          onClick={() => handlePresetClick(pill.preset)}
          disabled={isPending}
        >
          {pill.label}
        </button>
      ))}

      <Popover open={calendarOpen} onOpenChange={handleCalendarOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'admin-period-btn',
              isCustom ? 'admin-period-btn-active' : 'admin-period-btn-inactive'
            )}
            disabled={isPending}
          >
            {isCustom ? summariseRange(range) : 'Custom'}
          </button>
        </PopoverTrigger>
        <PopoverContent
          // A 2-month calendar is taller than the space below the trigger, so
          // Radix flips it upward — cap the height so it can never run past
          // the viewport edge whichever way it opens.
          className="luxury-calendar-popover max-h-[80vh] w-auto overflow-y-auto p-0"
          align="end"
          side="bottom"
          sideOffset={8}
          collisionPadding={12}
        >
          <Calendar
            autoFocus
            mode="range"
            // Open on the current month — a 12-month preset would otherwise
            // land the view a year back.
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
            <Button size="sm" onClick={handleApplyCustomRange} disabled={!draftRange?.from}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
