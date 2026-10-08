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

import { useCallback, useOptimistic, useState } from 'react'
import { format, parse } from 'date-fns'
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { bookingTodayAsCalendarDate } from '@/lib/utils/timezone'
import { rebuildSearchUrl, type ResultsSearchParams } from './results-search-params'
import { describeSearch, useSearchRefresh } from './search-refresh-context'
import { resolveGuestsForVehicle } from '@/components/home/hero/guest-breakdown'

interface ResultsDatePickerProps {
  searchParams: ResultsSearchParams
  className?: string
  /**
   * Which date this edits. `return` is the round-trip return date; it may not
   * fall before the outbound date.
   */
  field?: 'date' | 'return'
}

export function ResultsDatePicker({ searchParams, className, field = 'date' }: ResultsDatePickerProps) {
  const [open, setOpen] = useState(false)
  const { isPending, navigate } = useSearchRefresh()

  const isReturn = field === 'return'
  const outboundDate = searchParams.date ?? ''
  const currentDate = isReturn
    ? (searchParams.trip?.trip === 'round_trip' ? searchParams.trip.returnDate ?? '' : '')
    : outboundDate
  // Shows the tapped date straight away instead of the old one until the server
  // answers. Reverts to whatever the URL says once the navigation settles.
  const [shownDate, setShownDate] = useOptimistic(currentDate)
  const selected = shownDate ? parse(shownDate, 'yyyy-MM-dd', new Date()) : undefined
  const today = bookingTodayAsCalendarDate()
  const outbound = outboundDate ? parse(outboundDate, 'yyyy-MM-dd', new Date()) : undefined
  const minDate = isReturn && outbound && outbound > today ? outbound : today
  // Every picker locks while any change loads, but only the one that started it spins.
  const isLoadingThis = isPending && shownDate !== currentDate

  const commit = useCallback(
    (next: Date) => {
      const nextDate = format(next, 'yyyy-MM-dd')
      setOpen(false)
      if (nextDate === currentDate) return // nothing changed. Don't spend a round trip

      // The results pages redirect('/') without a total, so it always rides along.
      let url = rebuildSearchUrl(
        searchParams,
        isReturn ? { returnDate: nextDate } : { date: nextDate }
      )
      if (!url) {
        // /search/results has no slugs. buildSearchUrl would produce
        // /search/undefined-to-undefined. Preserve whatever params that route
        // arrived with and override the date only.
        const qs = new URLSearchParams(
          Object.entries(searchParams).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string'
          )
        )
        qs.set('date', nextDate)
        url = `/search/results?${qs.toString()}`
      }

      const guests = resolveGuestsForVehicle(searchParams, Infinity)
      const trip = searchParams.trip
      const returnDate = trip?.trip === 'round_trip' ? trip.returnDate : undefined
      // Mirrors rebuildSearchUrl, which drags the return along when the outbound passes it.
      const label = isReturn
        ? describeSearch(outboundDate, guests, nextDate)
        : describeSearch(nextDate, guests, returnDate && returnDate < nextDate ? nextDate : returnDate)
      navigate(url, label, () => setShownDate(nextDate))
    },
    [navigate, searchParams, currentDate, outboundDate, isReturn, setShownDate]
  )

  return (
    <div className={isPending ? 'pointer-events-none' : undefined} aria-busy={isPending}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={
              selected
                ? `${isReturn ? 'Return date' : 'Travel date'}: ${format(selected, 'EEE d MMM yyyy')}. Change date`
                : `Select ${isReturn ? 'return' : 'travel'} date`
            }
            className={
              className ??
              'inline-flex min-h-9 items-center gap-1.5 border-b border-dashed border-[rgba(var(--gold-rgb),0.45)] bg-transparent pb-0.5 text-[1.0625rem] text-[var(--text-primary)] transition-colors hover:border-[var(--gold-text)]'
            }
          >
            {isLoadingThis ? (
              <Loader2 className="h-3.5 w-3.5 flex-none animate-spin text-[var(--gold-text)] motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <CalendarIcon className="h-3.5 w-3.5 flex-none text-[var(--gold-text)]" aria-hidden="true" />
            )}
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
