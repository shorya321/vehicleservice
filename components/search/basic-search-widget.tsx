'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LocationAutocomplete } from './location-autocomplete'

interface Location {
  id: string
  name: string
  city: string
  country_code: string
}

export function BasicSearchWidget() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [fromLocation, setFromLocation] = useState<Location | null>(null)
  const [toLocation, setToLocation] = useState<Location | null>(null)
  const [passengers, setPassengers] = useState(2)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDate, setSelectedDate] = useState('2025-07-17')

  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  const handlePlusClick = () => {
    if (passengers < 8) {
      setPassengers(passengers + 1)
    }
  }

  const handleMinusClick = () => {
    if (passengers > 1) {
      setPassengers(passengers - 1)
    }
  }

  const handleCalendarClick = () => {
    setShowCalendar(!showCalendar)
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setShowCalendar(false)
  }

  const handleSearch = () => {
    if (fromLocation) {
      const params = new URLSearchParams({
        from: fromLocation.id,
        date: selectedDate,
        passengers: passengers.toString()
      })
      
      if (toLocation) {
        params.append('to', toLocation.id)
      }
      
      router.push(`/search/results?${params.toString()}`)
    }
  }

  if (!mounted) {
    return <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
      {/* Location inputs */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">From</label>
          <LocationAutocomplete
            placeholder="Airport, port, address"
            onSelect={setFromLocation}
            value={fromLocation?.name || ''}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">To (Optional)</label>
          <LocationAutocomplete
            placeholder="Destination"
            onSelect={setToLocation}
            value={toLocation?.name || ''}
          />
        </div>
      </div>

      {/* Date and passengers */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Date picker */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2">Date</label>
          <button
            onClick={handleCalendarClick}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-left focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            📅 {selectedDate}
          </button>
          
          {showCalendar && (
            <div className="absolute top-full left-0 z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-4">
              <div className="grid grid-cols-7 gap-1 text-sm">
                <div className="text-center font-medium">S</div>
                <div className="text-center font-medium">M</div>
                <div className="text-center font-medium">T</div>
                <div className="text-center font-medium">W</div>
                <div className="text-center font-medium">T</div>
                <div className="text-center font-medium">F</div>
                <div className="text-center font-medium">S</div>
                
                {/* Simple date buttons for July 2025 */}
                {Array.from({ length: 31 }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handleDateSelect(`2025-07-${String(i + 1).padStart(2, '0')}`)}
                    className="w-8 h-8 text-center hover:bg-blue-100 dark:hover:bg-gray-700 rounded"
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Passenger selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Passengers</label>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMinusClick}
              disabled={passengers <= 1}
              className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              -
            </button>
            <span className="w-8 text-center">{passengers}</span>
            <button
              onClick={handlePlusClick}
              disabled={passengers >= 8}
              className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>

        {/* Search button */}
        <div>
          <label className="block text-sm font-medium mb-2">&nbsp;</label>
          <button
            onClick={handleSearch}
            disabled={!fromLocation}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  )
}