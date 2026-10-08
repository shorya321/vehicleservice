'use client'

/**
 * Guests picker for the search results page.
 *
 * Most traffic doesn't come through the hero search: route cards, zone pages and ads all link in
 * with a hardcoded `passengers=2` and no breakdown. Without this, the first place a family can say
 * "we're 5" is checkout. Where the picker is already capped by the vehicle they just chose, so
 * they hit a dead end and have to start over from the home page.
 *
 * Changing the party size has to re-run the SERVER filter (`.gte('passenger_capacity', passengers)`),
 * so this navigates rather than filtering client-side.
 */

import { useCallback, useOptimistic, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { rebuildSearchUrl, type ResultsSearchParams } from './results-search-params'
import { describeSearch, useSearchRefresh } from './search-refresh-context'
import { GuestSelector } from '@/components/home/hero/guest-selector'
import {
  getSeatedCount,
  resolveGuestsForVehicle,
  type GuestBreakdown,
} from '@/components/home/hero/guest-breakdown'

interface ResultsGuestPickerProps {
  searchParams: ResultsSearchParams
  className?: string
}

export function ResultsGuestPicker({ searchParams, className }: ResultsGuestPickerProps) {
  const { isPending, navigate } = useSearchRefresh()
  // True only while a change started here is loading, so the date picker's changes don't spin it.
  const [isLoadingThis, setLoadingThis] = useOptimistic(false)

  // Infinity: the results page isn't scoped to a vehicle yet, so there's no capacity to clamp to.
  // This also converts the route-card case (passengers=2, no breakdown) into "2 adults".
  const current = resolveGuestsForVehicle(searchParams, Infinity)
  const [guests, setGuests] = useState<GuestBreakdown>(current)

  // Back/forward changes the URL under a mounted picker. Follow it, or the trigger keeps
  // showing the party from before.
  const currentKey = `${current.adults}-${current.children}-${current.infants}`
  const [syncedKey, setSyncedKey] = useState(currentKey)
  if (syncedKey !== currentKey) {
    setSyncedKey(currentKey)
    setGuests(current)
  }

  const commit = useCallback(
    (next: GuestBreakdown) => {
      const total = getSeatedCount(next)
      if (
        next.adults === current.adults &&
        next.children === current.children &&
        next.infants === current.infants
      ) {
        return // nothing changed. Don't spend a round trip
      }

      // `passengers` and the breakdown must be written together: resolveGuestsForVehicle discards a
      // breakdown that disagrees with the stated total.
      const params = {
        date: searchParams.date ?? '',
        passengers: total,
        adults: next.adults,
        children: next.children,
        infants: next.infants,
      }

      let url = rebuildSearchUrl(searchParams, { date: params.date, guests: params })
      if (!url) {
        // /search/results has no slugs. buildSearchUrl would produce /search/undefined-to-undefined.
        // Preserve whatever params that route arrived with and override the guest ones.
        const qs = new URLSearchParams(
          Object.entries(searchParams).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string'
          )
        )
        qs.set('passengers', String(total))
        qs.set('adults', String(next.adults))
        qs.set('children', String(next.children))
        qs.set('infants', String(next.infants))
        url = `/search/results?${qs.toString()}`
      }

      const trip = searchParams.trip
      const label = describeSearch(
        searchParams.date,
        next,
        trip?.trip === 'round_trip' ? trip.returnDate : undefined
      )
      navigate(url, label, () => setLoadingThis(true))
    },
    [navigate, searchParams, current.adults, current.children, current.infants, setLoadingThis]
  )

  return (
    <div
      className={isPending ? 'pointer-events-none relative' : 'relative'}
      aria-busy={isPending}
    >
      <GuestSelector
        value={guests}
        onChange={setGuests}
        showChevron
        // Commit on close rather than per stepper tap. GuestSelector fires onChange on every click,
        // and each commit is a full server round trip.
        onOpenChange={(open) => {
          if (!open) commit(guests)
        }}
        className={
          className ??
          'flex min-h-9 w-full items-center gap-1.5 rounded-md border border-[var(--graphite)] bg-transparent px-2.5 text-[1rem] text-[var(--text-primary)] transition-colors hover:border-[var(--gold-text)]'
        }
      />
      {isLoadingThis && (
        <Loader2
          className="absolute -right-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-[var(--gold-text)] motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
    </div>
  )
}
