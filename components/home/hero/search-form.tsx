"use client"
import { useCallback, useLayoutEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format, parse } from 'date-fns'
import type { LocationSearchResult } from '@/lib/types/location'
import { LocationSearchAutocomplete } from '@/components/search/location-search-autocomplete'
import { buildSearchUrl } from '@/lib/utils/url-builder'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { GuestSelector } from './guest-selector'
import { getSeatedCount, type GuestBreakdown } from './guest-breakdown'

export function SearchForm({ todayDate }: { todayDate: string }) {
  const router = useRouter()

  const [fromLocation, setFromLocation] = useState<LocationSearchResult | null>(null)
  const [toLocation, setToLocation] = useState<LocationSearchResult | null>(null)
  const [guests, setGuests] = useState<GuestBreakdown>({ adults: 2, children: 0, infants: 0 })
  const [selectedDate, setSelectedDate] = useState(todayDate)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const [mounted, setMounted] = useState(false)
  const [fromInput, setFromInput] = useState('')
  const [toInput, setToInput] = useState('')

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  const handleFromInput = useCallback((value: string) => {
    setFromInput(value)
    setFromLocation(prev => prev && prev.name === value ? prev : null)
  }, [])

  const handleToInput = useCallback((value: string) => {
    setToInput(value)
    setToLocation(prev => prev && prev.name === value ? prev : null)
  }, [])

  const selectFromLocation = useCallback((location: LocationSearchResult) => {
    setFromLocation(location)
    setFromInput(location.name)
  }, [])

  const selectToLocation = useCallback((location: LocationSearchResult) => {
    setToLocation(location)
    setToInput(location.name)
  }, [])

  const handleSearch = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (fromLocation && toLocation) {
      router.push(buildSearchUrl(fromLocation.slug, toLocation.slug, {
        date: selectedDate,
        // `passengers` stays the total so the results pages (which redirect('/') without it) and
        // every existing link keep working. The breakdown rides alongside.
        passengers: getSeatedCount(guests),
        adults: guests.adults,
        children: guests.children,
        infants: guests.infants,
      }))
    }
  }, [fromLocation, guests, router, selectedDate, toLocation])

  return (
    <form
      onSubmit={handleSearch}
      className="search-bar"
      aria-labelledby="hero-headline"
    >
      {/* From */}
      <div className="search-bar-field search-bar-field--location">
        <label htmlFor="pickup-location" className="search-bar-label">From</label>
        <LocationSearchAutocomplete
          id="pickup-location"
          value={fromInput}
          onChange={handleFromInput}
          onSelect={selectFromLocation}
          placeholder="Airport, hotel, or address"
          ariaLabel="Pick-up location"
          selectedLocation={fromLocation}
          variant="hero"
        />
      </div>

      <div className="search-bar-divider" aria-hidden />

      {/* To */}
      <div className="search-bar-field search-bar-field--location">
        <label htmlFor="dropoff-location" className="search-bar-label">To</label>
        <LocationSearchAutocomplete
          id="dropoff-location"
          value={toInput}
          onChange={handleToInput}
          onSelect={selectToLocation}
          placeholder="Airport, hotel, or address"
          ariaLabel="Drop-off location"
          selectedLocation={toLocation}
          variant="hero"
        />
      </div>

      <div className="search-bar-divider" aria-hidden />

      {/* Date */}
      <div className="search-bar-field search-bar-field--compact">
        <label htmlFor="travel-date" className="search-bar-label">Date</label>
        {mounted ? (
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                id="travel-date"
                type="button"
                className="search-bar-input search-bar-date-trigger"
              >
                <CalendarDays
                  className="w-4 h-4 shrink-0 text-[var(--text-muted)]"
                  aria-hidden
                />
                <span className="truncate">
                  {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="luxury-calendar-popover w-auto p-0"
              align="start"
              sideOffset={8}
            >
              <Calendar
                mode="single"
                selected={parse(selectedDate, 'yyyy-MM-dd', new Date())}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(format(date, 'yyyy-MM-dd'))
                    setCalendarOpen(false)
                  }
                }}
                disabled={{ before: parse(todayDate, 'yyyy-MM-dd', new Date()) }}
                defaultMonth={parse(selectedDate, 'yyyy-MM-dd', new Date())}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        ) : (
          <button
            id="travel-date"
            type="button"
            className="search-bar-input search-bar-date-trigger"
          >
            <CalendarDays
              className="w-4 h-4 shrink-0 text-[var(--text-muted)]"
              aria-hidden
            />
            <span className="truncate">
              {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}
            </span>
          </button>
        )}
      </div>

      <div className="search-bar-divider" aria-hidden />

      {/* Guests */}
      <div className="search-bar-field search-bar-field--guests">
        <label htmlFor="guests" className="search-bar-label">Guests</label>
        <GuestSelector value={guests} onChange={setGuests} />
      </div>

      {/* Search button */}
      <button
        type="submit"
        disabled={!fromLocation || !toLocation}
        className="search-bar-submit"
        aria-label="Search transfers"
      >
        <span className="hidden sm:inline">Search</span>
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </form>
  )
}
