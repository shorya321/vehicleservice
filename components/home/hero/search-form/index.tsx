"use client"
import { useCallback, useLayoutEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { buildHourlySearchUrl, buildSearchUrl } from '@/lib/utils/url-builder'
import type { TripSettings } from '@/lib/trips/settings'
import type { HourlyPackage, TripType } from '@/lib/trips/types'
import { GuestSelector } from '../guest-selector'
import { getSeatedCount, type GuestBreakdown } from '../guest-breakdown'
import { DateField } from './date-field'
import { HourlyPackageField } from './hourly-package-field'
import { LocationField } from './location-field'
import { TripTabs } from './trip-tabs'
import { useLocationInput } from './use-location-input'
import { MultiCityForm } from './multi-city-form'

interface SearchFormProps {
  todayDate: string
  /** Which trip types the admin has switched on. One way is always offered. */
  tripSettings?: Pick<TripSettings, 'round_trip_enabled' | 'multi_city_enabled' | 'hourly_enabled' | 'multi_city_max_legs'>
}

/** Tab order: the three single-bar searches, then multi-city with its own journey editor. */
const SUPPORTED: TripType[] = ['one_way', 'round_trip', 'multi_city', 'hourly']

const BAR_CLASS: Record<TripType, string> = {
  one_way: 'search-bar',
  round_trip: 'search-bar search-bar--round',
  multi_city: 'search-bar',
  hourly: 'search-bar search-bar--hourly',
}

export function SearchForm({ todayDate, tripSettings }: SearchFormProps) {
  const router = useRouter()

  const tabs = useMemo<TripType[]>(() => {
    const enabled: Record<TripType, boolean> = {
      one_way: true,
      round_trip: tripSettings?.round_trip_enabled ?? false,
      multi_city: tripSettings?.multi_city_enabled ?? false,
      hourly: tripSettings?.hourly_enabled ?? false,
    }
    return SUPPORTED.filter((trip) => enabled[trip])
  }, [tripSettings])

  const [tripType, setTripType] = useState<TripType>('one_way')
  const from = useLocationInput()
  const to = useLocationInput()
  const [guests, setGuests] = useState<GuestBreakdown>({ adults: 2, children: 0, infants: 0 })
  const [selectedDate, setSelectedDate] = useState(todayDate)
  const [returnDate, setReturnDate] = useState(todayDate)
  const [hourlyPackage, setHourlyPackage] = useState<HourlyPackage>('half_day')

  const [mounted, setMounted] = useState(false)
  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  const handleDateChange = useCallback((value: string) => {
    setSelectedDate(value)
    // A return can never precede the outbound; drag it along.
    setReturnDate((current) => (current < value ? value : current))
  }, [])

  const guestParams = {
    // `passengers` stays the total so the results pages (which redirect('/') without it) and
    // every existing link keep working. The breakdown rides alongside.
    passengers: getSeatedCount(guests),
    adults: guests.adults,
    children: guests.children,
    infants: guests.infants,
  }

  const canSearch = tripType === 'hourly' ? !!from.location : !!from.location && !!to.location

  const handleSearch = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!from.location) return

    if (tripType === 'hourly') {
      router.push(buildHourlySearchUrl(from.location.slug, { date: selectedDate, hourlyPackage, ...guestParams }))
      return
    }
    if (!to.location) return

    router.push(
      buildSearchUrl(
        from.location.slug,
        to.location.slug,
        { date: selectedDate, ...guestParams },
        tripType === 'round_trip' ? { trip: 'round_trip', returnDate } : undefined
      )
    )
    // guestParams is derived from guests on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from.location, to.location, guests, router, selectedDate, returnDate, hourlyPackage, tripType])

  if (tripType === 'multi_city') {
    return (
      <>
        <TripTabs tabs={tabs} value={tripType} onChange={setTripType} />
        <MultiCityForm
          todayDate={todayDate}
          maxLegs={tripSettings?.multi_city_max_legs ?? 4}
          mounted={mounted}
          guests={guests}
          onGuestsChange={setGuests}
        />
      </>
    )
  }

  return (
    <>
      <TripTabs tabs={tabs} value={tripType} onChange={setTripType} />
      <form
        onSubmit={handleSearch}
        className={BAR_CLASS[tripType]}
        aria-label={tripType === 'hourly' ? 'Hourly hire search' : 'Transfer search'}
      >
        <LocationField
          id="pickup-location"
          label="From"
          placeholder={tripType === 'round_trip' ? 'Pickup' : 'Airport or hotel'}
          ariaLabel="Pick-up location"
          input={from.input}
          location={from.location}
          onInput={from.onInput}
          onSelect={from.onSelect}
        />

        {tripType !== 'hourly' && (
          <LocationField
            id="dropoff-location"
            label="To"
            placeholder={tripType === 'round_trip' ? 'Drop-off' : 'Hotel or address'}
            ariaLabel="Drop-off location"
            input={to.input}
            location={to.location}
            onInput={to.onInput}
            onSelect={to.onSelect}
          />
        )}

        <DateField
          id="travel-date"
          label={tripType === 'round_trip' ? 'Depart' : 'Date'}
          value={selectedDate}
          onChange={handleDateChange}
          minDate={todayDate}
          mounted={mounted}
          short={tripType === 'round_trip'}
        />

        {tripType === 'round_trip' && (
          <DateField
            id="return-date"
            label="Return"
            value={returnDate}
            onChange={setReturnDate}
            minDate={selectedDate}
            mounted={mounted}
            short
          />
        )}

        {tripType === 'hourly' && <HourlyPackageField value={hourlyPackage} onChange={setHourlyPackage} />}

        <div className="search-bar-field search-bar-field--guests">
          <label htmlFor="guests" className="search-bar-label">Guests</label>
          <GuestSelector value={guests} onChange={setGuests} showChevron />
        </div>

        <button
          type="submit"
          disabled={!canSearch}
          className="search-bar-submit"
          aria-label={tripType === 'hourly' ? 'Search hourly hire' : 'Search transfers'}
        >
          <span>Search</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </>
  )
}
