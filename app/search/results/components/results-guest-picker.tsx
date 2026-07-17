'use client'

/**
 * Guests picker for the search results page.
 *
 * Most traffic doesn't come through the hero search: route cards, zone pages and ads all link in
 * with a hardcoded `passengers=2` and no breakdown. Without this, the first place a family can say
 * "we're 5" is checkout — where the picker is already capped by the vehicle they just chose, so
 * they hit a dead end and have to start over from the home page.
 *
 * Changing the party size has to re-run the SERVER filter (`.gte('passenger_capacity', passengers)`),
 * so this navigates rather than filtering client-side.
 */

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { buildSearchUrl } from '@/lib/utils/url-builder'
import { GuestSelector } from '@/components/home/hero/guest-selector'
import {
  getSeatedCount,
  resolveGuestsForVehicle,
  type GuestBreakdown,
} from '@/components/home/hero/guest-breakdown'

interface ResultsGuestPickerProps {
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

export function ResultsGuestPicker({ searchParams, className }: ResultsGuestPickerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Infinity: the results page isn't scoped to a vehicle yet, so there's no capacity to clamp to.
  // This also converts the route-card case (passengers=2, no breakdown) into "2 adults".
  const [guests, setGuests] = useState<GuestBreakdown>(() =>
    resolveGuestsForVehicle(searchParams, Infinity)
  )

  const commit = useCallback(
    (next: GuestBreakdown) => {
      const total = getSeatedCount(next)
      if (total === Number(searchParams.passengers) && next.adults === Number(searchParams.adults)) {
        return // nothing changed — don't spend a round trip
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

      startTransition(() => {
        if (searchParams.originSlug && searchParams.destSlug) {
          router.push(buildSearchUrl(searchParams.originSlug, searchParams.destSlug, params))
          return
        }
        // /search/results has no slugs — buildSearchUrl would produce /search/undefined-to-undefined.
        // Preserve whatever params that route arrived with and override the guest ones.
        const qs = new URLSearchParams(
          Object.entries(searchParams).filter(
            (entry): entry is [string, string] => entry[1] !== undefined
          )
        )
        qs.set('passengers', String(total))
        qs.set('adults', String(next.adults))
        qs.set('children', String(next.children))
        qs.set('infants', String(next.infants))
        router.push(`/search/results?${qs.toString()}`)
      })
    },
    [router, searchParams]
  )

  return (
    <div
      className={isPending ? 'pointer-events-none opacity-60 transition-opacity' : undefined}
      aria-busy={isPending}
    >
      <GuestSelector
        value={guests}
        onChange={setGuests}
        // Commit on close rather than per stepper tap — GuestSelector fires onChange on every click,
        // and each commit is a full server round trip.
        onOpenChange={(open) => {
          if (!open) commit(guests)
        }}
        className={
          className ??
          'flex min-h-9 w-full items-center gap-1.5 rounded-md border border-[var(--graphite)] bg-transparent px-2.5 text-[1rem] text-[var(--text-primary)] transition-colors hover:border-[var(--gold-text)]'
        }
      />
    </div>
  )
}
