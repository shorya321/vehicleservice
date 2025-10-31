"use client"
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
    <motion.form
      onSubmit={handleSearch}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
      className="w-full max-w-6xl p-3 rounded-xl shadow-2xl backdrop-blur-lg border bg-luxury-darkGray/50 border-luxury-gold/20"
    >
      <div className="flex flex-col md:flex-row items-center gap-2">
        {/* From Input */}
        <LocationAutocomplete
          value={fromInput}
          onChange={handleFromInput}
          onSelect={selectFromLocation}
          placeholder="From (airport, port, address)"
          ariaLabel="Pick-up location"
          selectedLocation={fromLocation}
        />

        <div className="hidden md:block border-l h-8 mx-1 border-luxury-gold/20" aria-hidden="true"></div>
        <div className="w-full md:w-auto h-px md:h-auto my-1 md:my-0 bg-luxury-gold/20" aria-hidden="true"></div>

        {/* To Input */}
        <LocationAutocomplete
          value={toInput}
          onChange={handleToInput}
          onSelect={selectToLocation}
          placeholder="To (airport, port, address)"
          ariaLabel="Drop-off location"
          selectedLocation={toLocation}
        />

        <div className="hidden md:block border-l h-8 mx-1 border-luxury-gold/20" aria-hidden="true"></div>
        <div className="w-full md:w-auto h-px md:h-auto my-1 md:my-0 bg-luxury-gold/20" aria-hidden="true"></div>

        {/* Date Input */}
        <div className="relative w-full md:w-auto">
          <label htmlFor="travel-date" className="sr-only">Travel date</label>
          <CalendarDays
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-luxury-gold"
            aria-hidden="true"
          />
          <Input
            id="travel-date"
            type="date"
            value={selectedDate}
            min={todayStr}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full md:w-40 h-14 bg-transparent border-0 focus-visible:ring-2 focus-visible:ring-luxury-gold pl-12 text-base text-luxury-pearl"
          />
        </div>

        <div className="hidden md:block border-l h-8 mx-1 border-luxury-gold/20" aria-hidden="true"></div>
        <div className="w-full md:w-auto h-px md:h-auto my-1 md:my-0 bg-luxury-gold/20" aria-hidden="true"></div>

        {/* Passengers Input */}
        <div className="relative w-full md:w-auto">
          <label htmlFor="passengers" className="sr-only">Number of passengers</label>
          <Users
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-luxury-gold"
            aria-hidden="true"
          />
          <Input
            id="passengers"
            type="number"
            placeholder="Guests"
            min="1"
            max="20"
            value={passengers}
            onChange={(e) => setPassengers(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-full md:w-32 h-14 bg-transparent border-0 focus-visible:ring-2 focus-visible:ring-luxury-gold pl-12 text-base text-luxury-pearl placeholder:text-luxury-gold/70"
          />
        </div>

        {/* Search Button */}
        <Button
          type="submit"
          size="default"
          disabled={!fromLocation || !toLocation || !mounted}
          className="w-full md:w-auto flex-shrink-0 h-14 mt-2 md:mt-0 ml-0 md:ml-1"
        >
          SEARCH
        </Button>
      </div>
    </motion.form>
  )
}
