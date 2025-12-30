"use client"
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { CalendarDays, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Location } from '@/lib/types/location'
import { LocationAutocomplete } from './location-autocomplete'

export function SearchForm() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const [fromLocation, setFromLocation] = useState<Location | null>(null)
  const [toLocation, setToLocation] = useState<Location | null>(null)
  const [passengers, setPassengers] = useState(2)

  // Initialize with today's date
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)

  // From autocomplete state
  const [fromInput, setFromInput] = useState('')

  // To autocomplete state
  const [toInput, setToInput] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFromInput = (value: string) => {
    setFromInput(value)
    setFromLocation(null)
  }

  const handleToInput = (value: string) => {
    setToInput(value)
    setToLocation(null)
  }

  const selectFromLocation = (location: Location) => {
    setFromLocation(location)
    setFromInput(location.name)
  }

  const selectToLocation = (location: Location) => {
    setToLocation(location)
    setToInput(location.name)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (fromLocation && toLocation) {
      const params = new URLSearchParams({
        from: fromLocation.id,
        to: toLocation.id,
        date: selectedDate,
        passengers: passengers.toString()
      })

      router.push(`/search/results?${params.toString()}`)
    }
  }

  return (
    <div className="booking-card w-full">
      {/* Card Header */}
      <div className="booking-card-header">
        <h2 className="booking-card-title">Book Your Transfer</h2>
        <p className="booking-card-subtitle">Enter your journey details</p>
      </div>

      <form onSubmit={handleSearch} className="booking-form">
        {/* From Input */}
        <div className="form-group">
          <label className="form-label">Pick-up Location</label>
          <LocationAutocomplete
            value={fromInput}
            onChange={handleFromInput}
            onSelect={selectFromLocation}
            placeholder="Airport, hotel, or address"
            ariaLabel="Pick-up location"
            selectedLocation={fromLocation}
          />
        </div>

        {/* To Input */}
        <div className="form-group">
          <label className="form-label">Drop-off Location</label>
          <LocationAutocomplete
            value={toInput}
            onChange={handleToInput}
            onSelect={selectToLocation}
            placeholder="Airport, hotel, or address"
            ariaLabel="Drop-off location"
            selectedLocation={toLocation}
          />
        </div>

        {/* Date & Passengers Row */}
        <div className="form-row">
          {/* Date Input */}
          <div className="form-group">
            <label htmlFor="travel-date" className="form-label">Date</label>
            <div className="relative">
              <CalendarDays
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--gold)]"
                aria-hidden="true"
              />
              <Input
                id="travel-date"
                type="date"
                value={selectedDate}
                min={todayStr}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="luxury-input pl-11 h-12"
              />
            </div>
          </div>

          {/* Passengers Input */}
          <div className="form-group">
            <label htmlFor="passengers" className="form-label">Passengers</label>
            <div className="relative">
              <Users
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--gold)]"
                aria-hidden="true"
              />
              <Input
                id="passengers"
                type="number"
                placeholder="2"
                min="1"
                max="20"
                value={passengers}
                onChange={(e) => setPassengers(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                className="luxury-input pl-11 h-12"
              />
            </div>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={!fromLocation || !toLocation || !mounted}
          className="btn btn-primary btn-lg w-full mt-2 disabled:cursor-not-allowed"
        >
          Search Vehicles
        </button>
      </form>
    </div>
  )
}
