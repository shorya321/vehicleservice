'use client'

/**
 * Travel date picker for the search results page.
 *
 * Guests was already editable here while the date sat next to it as dead text,
 * so the two values in the same rail behaved differently and the only way to
 * shift a trip by a day was to go back to the home page and search again.
 *
 * Like the guests picker, changing the date has to re-run the server query
 * (availability is resolved per day), so this navigates rather than filtering
 * client-side.
 *
 * The date is carried as a `yyyy-MM-dd` calendar string end to end and parsed
 * and formatted in local time on both sides. That round trip is symmetric, so
 * it is the case the timezone policy explicitly exempts: pinning it to the
 * booking zone here would shift the day the user actually tapped. Only the
 * "today" floor is zone-aware, via `bookingTodayAsCalendarDate`.
 */

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, parse } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { bookingTodayAsCalendarDate } from '@/lib/utils/timezone'
import { buildSearchUrl } from '@/lib/utils/url-builder'

interface ResultsDatePickerProps {
  searchParams: {
    date?: string
    passengers?: string
    adults?: string
    children?: string
    infants?: string
    originSlug?: string
    destSlug?: string
  }
  className?: string
}

const toCount = (v: string | undefined): number | undefined => {
  if (v === undefined) return undefined
  const n = parseInt(v)
  return Number.isNaN(n) ? undefined : n
}

export function ResultsDatePicker({ searchParams, className }: ResultsDatePickerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const currentDate = searchParams.date ?? ''
  const selected = currentDate ? parse(currentDate, 'yyyy-MM-dd', new Date()) : undefined
  const minDate = bookingTodayAsCalendarDate()

  const commit = useCallback(
    (next: Date) => {
      const nextDate = format(next, 'yyyy-MM-dd')
      setOpen(false)
      if (nextDate === currentDate) return // nothing changed. Don't spend a round trip

      startTransition(() => {
        if (searchParams.originSlug && searchParams.destSlug) {
          router.push(
            buildSearchUrl(searchParams.originSlug, searchParams.destSlug, {
              date: nextDate,
              // The results pages redirect('/') without a total, so it always rides along.
              passengers: searchParams.passengers ?? '1',
              adults: toCount(searchParams.adults),
              children: toCount(searchParams.children),
              infants: toCount(searchParams.infants),
            })
          )
          return
        }
        // /search/results has no slugs. buildSearchUrl would produce
        // /search/undefined-to-undefined. Preserve whatever params that route
        // arrived with and override the date only.
        const qs = new URLSearchParams(
          Object.entries(searchParams).filter(
            (entry): entry is [string, string] => entry[1] !== undefined
          )
        )
        qs.set('date', nextDate)
        router.push(`/search/results?${qs.toString()}`)
      })
    },
    [router, searchParams, currentDate]
  )

  return (
    <div
      className={isPending ? 'pointer-events-none opacity-60 transition-opacity' : undefined}
      aria-busy={isPending}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={
              selected ? `Travel date: ${format(selected, 'EEE d MMM yyyy')}. Change date` : 'Select travel date'
            }
            className={
              className ??
              'inline-flex min-h-9 items-center gap-1.5 border-b border-dashed border-[rgba(var(--gold-rgb),0.45)] bg-transparent pb-0.5 text-[1.0625rem] text-[var(--text-primary)] transition-colors hover:border-[var(--gold-text)]'
            }
          >
            <CalendarIcon className="h-3.5 w-3.5 flex-none text-[var(--gold-text)]" aria-hidden="true" />
            <span className="numeric">
              {selected ? format(selected, 'EEE · d MMM yyyy') : 'Select date'}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="luxury-calendar-popover w-auto p-0" align="start" sideOffset={8}>
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) commit(date)
            }}
            disabled={{ before: minDate }}
            defaultMonth={selected ?? minDate}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
