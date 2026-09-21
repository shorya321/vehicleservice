"use client"
import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { LocationSearchResult } from '@/lib/types/location'
import { buildMultiCitySearchUrl } from '@/lib/utils/url-builder'
import { GuestSelector } from '../guest-selector'
import { getSeatedCount, type GuestBreakdown } from '../guest-breakdown'
import { DateField } from './date-field'
import { LocationField } from './location-field'

interface LegState {
  key: number
  from: LocationSearchResult | null
  fromInput: string
  to: LocationSearchResult | null
  toInput: string
  date: string
}

interface MultiCityFormProps {
  todayDate: string
  maxLegs: number
  mounted: boolean
  guests: GuestBreakdown
  onGuestsChange: (value: GuestBreakdown) => void
}

let nextKey = 0
const emptyLeg = (date: string, from: LocationSearchResult | null = null): LegState => ({
  key: nextKey++,
  from,
  fromInput: from?.name ?? '',
  to: null,
  toInput: '',
  date,
})

/**
 * Multi-city: one bar per journey, then guests, "Add journey" and Search. Each new
 * journey starts where the previous one ended, on the same day, as flight sites do.
 */
export function MultiCityForm({ todayDate, maxLegs, mounted, guests, onGuestsChange }: MultiCityFormProps) {
  const router = useRouter()
  const [legs, setLegs] = useState<LegState[]>(() => [emptyLeg(todayDate), emptyLeg(todayDate)])

  const update = useCallback((key: number, patch: Partial<LegState>) => {
    setLegs((prev) => {
      const index = prev.findIndex((leg) => leg.key === key)
      return prev.map((leg, i) => {
        if (leg.key === key) return { ...leg, ...patch }
        // Later journeys can never be dated before an earlier one.
        if (patch.date && i > index && leg.date < patch.date) return { ...leg, date: patch.date }
        return leg
      })
    })
  }, [])

  const addLeg = () => {
    setLegs((prev) => {
      if (prev.length >= maxLegs) return prev
      const last = prev[prev.length - 1]
      return [...prev, emptyLeg(last.date, last.to)]
    })
  }

  const removeLeg = (key: number) => setLegs((prev) => (prev.length <= 2 ? prev : prev.filter((leg) => leg.key !== key)))

  const complete = legs.every((leg) => leg.from && leg.to && leg.from.id !== leg.to.id)

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!complete) return
    router.push(
      buildMultiCitySearchUrl(
        legs.map((leg) => ({ from: leg.from!.slug, to: leg.to!.slug, date: leg.date })),
        {
          passengers: getSeatedCount(guests),
          adults: guests.adults,
          children: guests.children,
          infants: guests.infants,
        }
      )
    )
  }

  return (
    <form onSubmit={handleSearch} className="search-multi" aria-label="Multi-city search">
      {legs.map((leg, index) => (
        <fieldset key={leg.key} className="search-bar search-bar--leg">
          <legend className="sr-only">Journey {index + 1}</legend>
          <LocationField
            id={`leg-${leg.key}-from`}
            label={`Journey ${index + 1} from`}
            placeholder="Airport or hotel"
            ariaLabel={`Journey ${index + 1} pick-up location`}
            input={leg.fromInput}
            location={leg.from}
            onInput={(value) => update(leg.key, { fromInput: value, from: leg.from?.name === value ? leg.from : null })}
            onSelect={(location) => update(leg.key, { from: location, fromInput: location.name })}
          />
          <LocationField
            id={`leg-${leg.key}-to`}
            label="To"
            placeholder="Hotel or address"
            ariaLabel={`Journey ${index + 1} drop-off location`}
            input={leg.toInput}
            location={leg.to}
            onInput={(value) => update(leg.key, { toInput: value, to: leg.to?.name === value ? leg.to : null })}
            onSelect={(location) => update(leg.key, { to: location, toInput: location.name })}
          />
          <DateField
            id={`leg-${leg.key}-date`}
            label="Date"
            value={leg.date}
            onChange={(date) => update(leg.key, { date })}
            minDate={index === 0 ? todayDate : legs[index - 1].date}
            mounted={mounted}
          />
          {legs.length > 2 && (
            <button
              type="button"
              onClick={() => removeLeg(leg.key)}
              className="search-leg-remove"
              aria-label={`Remove journey ${index + 1}`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </fieldset>
      ))}

      <div className="search-bar search-bar--multi-footer">
        <div className="search-bar-field search-bar-field--guests">
          <label htmlFor="guests" className="search-bar-label">Guests</label>
          <GuestSelector value={guests} onChange={onGuestsChange} showChevron />
        </div>
        <button
          type="button"
          onClick={addLeg}
          disabled={legs.length >= maxLegs}
          className="search-leg-add"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{legs.length >= maxLegs ? `Up to ${maxLegs} journeys` : 'Add journey'}</span>
        </button>
        <button type="submit" disabled={!complete} className="search-bar-submit" aria-label="Search multi-city trip">
          <span>Search</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}
