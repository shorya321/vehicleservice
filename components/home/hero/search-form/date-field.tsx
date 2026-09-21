"use client"
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { CalendarDays } from 'lucide-react'
import { format, parse } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// react-day-picker only renders once the date popover opens, so it stays out of
// the hero's first-load bundle. The placeholder holds the month grid's size.
const Calendar = dynamic(
  () => import('@/components/ui/calendar').then((m) => m.Calendar),
  { ssr: false, loading: () => <div className="h-[19rem] w-[17.5rem]" aria-hidden="true" /> }
)

interface DateFieldProps {
  id: string
  label: string
  /** `yyyy-MM-dd`, operating-timezone calendar date. */
  value: string
  onChange: (value: string) => void
  /** Earliest selectable day, `yyyy-MM-dd`. */
  minDate: string
  /** False until after hydration: the SSR placeholder is the same button without a popover. */
  mounted: boolean
  /** Drop the year ("Oct 5") where two dates share the bar. The aria label keeps it. */
  short?: boolean
}

const toDate = (value: string): Date => parse(value, 'yyyy-MM-dd', new Date())

/**
 * One date cell of the hero bar. Calendar dates are parsed and formatted
 * locally on purpose: a `yyyy-MM-dd` round trip is symmetric, and pinning it
 * to the booking zone would shift the day the customer tapped.
 */
export function DateField({ id, label, value, onChange, minDate, mounted, short = false }: DateFieldProps) {
  const [open, setOpen] = useState(false)
  const full = format(toDate(value), 'MMM d, yyyy')
  const display = short ? format(toDate(value), 'MMM d') : full

  const trigger = (
    <button
      id={id}
      type="button"
      className="search-bar-input search-bar-date-trigger"
      aria-label={`${label}, ${full}`}
    >
      <CalendarDays className="w-4 h-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
      <span className="truncate">{display}</span>
    </button>
  )

  return (
    <div className="search-bar-field search-bar-field--compact">
      <label htmlFor={id} className="search-bar-label">{label}</label>
      {mounted ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent className="luxury-calendar-popover w-auto p-0" align="start" sideOffset={8}>
            <Calendar
              mode="single"
              selected={toDate(value)}
              onSelect={(date) => {
                if (date) {
                  onChange(format(date, 'yyyy-MM-dd'))
                  setOpen(false)
                }
              }}
              disabled={{ before: toDate(minDate) }}
              defaultMonth={toDate(value)}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      ) : (
        trigger
      )}
    </div>
  )
}
