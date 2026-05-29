"use client"
import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, CalendarDays, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format, parse } from 'date-fns'
import { Location } from '@/lib/types/location'
import { LocationAutocomplete } from './location-autocomplete'
import { buildSearchUrl } from '@/lib/utils/url-builder'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function SearchForm({ todayDate }: { todayDate: string }) {
  const router = useRouter()

  const [fromLocation, setFromLocation] = useState<Location | null>(null)
  const [toLocation, setToLocation] = useState<Location | null>(null)
  const [passengers, setPassengers] = useState(2)
  const [selectedDate, setSelectedDate] = useState(todayDate)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const [fromInput, setFromInput] = useState('')
  const [toInput, setToInput] = useState('')

  const handleFromInput = useCallback((value: string) => {
    setFromInput(value)
    setFromLocation(null)
  }, [])

  const handleToInput = useCallback((value: string) => {
    setToInput(value)
    setToLocation(null)
  }, [])

  const selectFromLocation = useCallback((location: Location) => {
    setFromLocation(location)
    setFromInput(location.name)
  }, [])

  const selectToLocation = useCallback((location: Location) => {
    setToLocation(location)
    setToInput(location.name)
  }, [])

  const handleSearch = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (fromLocation && toLocation) {
      router.push(buildSearchUrl(fromLocation.slug, toLocation.slug, {
        date: selectedDate,
        passengers: passengers,
      }))
    }
  }, [fromLocation, passengers, router, selectedDate, toLocation])

  return (
    <form
      onSubmit={handleSearch}
      className="search-bar"
      aria-labelledby="hero-headline"
    >
      {/* From */}
      <div className="search-bar-field search-bar-field--location">
        <label htmlFor="pickup-location" className="search-bar-label">From</label>
        <LocationAutocomplete
          id="pickup-location"
          value={fromInput}
          onChange={handleFromInput}
          onSelect={selectFromLocation}
          placeholder="Airport, hotel, or address"
          ariaLabel="Pick-up location"
          selectedLocation={fromLocation}
        />
      </div>

      <div className="search-bar-divider" aria-hidden />

      {/* To */}
      <div className="search-bar-field search-bar-field--location">
        <label htmlFor="dropoff-location" className="search-bar-label">To</label>
        <LocationAutocomplete
          id="dropoff-location"
          value={toInput}
          onChange={handleToInput}
          onSelect={selectToLocation}
          placeholder="Airport, hotel, or address"
          ariaLabel="Drop-off location"
          selectedLocation={toLocation}
        />
      </div>

      <div className="search-bar-divider" aria-hidden />

      {/* Date */}
      <div className="search-bar-field search-bar-field--compact">
        <label htmlFor="travel-date" className="search-bar-label">Date</label>
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
            className="search-bar-calendar-popover w-auto p-0"
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
      </div>

      <div className="search-bar-divider" aria-hidden />

      {/* Passengers */}
      <div className="search-bar-field search-bar-field--narrow">
        <label htmlFor="passengers" className="search-bar-label">Passengers</label>
        <div className="relative">
          <Users
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--text-muted)]"
            aria-hidden
          />
          <input
            id="passengers"
            type="number"
            min={1}
            max={20}
            value={passengers}
            onChange={(e) => setPassengers(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
            className="search-bar-input pl-9"
          />
        </div>
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
