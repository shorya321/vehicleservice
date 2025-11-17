'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Location } from '@/lib/types/location'
import { Plane, Building2, Hotel, Train, MapPin } from 'lucide-react'

export function WorkingSearchWidget() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Function to get icon based on location type
  const getLocationIcon = (type: string) => {
    switch(type) {
      case 'airport':
        return <Plane className="h-4 w-4 text-gray-500" />
      case 'city':
        return <Building2 className="h-4 w-4 text-gray-500" />
      case 'hotel':
        return <Hotel className="h-4 w-4 text-gray-500" />
      case 'station':
        return <Train className="h-4 w-4 text-gray-500" />
      default:
        return <MapPin className="h-4 w-4 text-gray-500" />
    }
  }
  const [fromLocation, setFromLocation] = useState<Location | null>(null)
  const [toLocation, setToLocation] = useState<Location | null>(null)
  const [passengers, setPassengers] = useState(2)
  
  // Initialize with today's date
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  
  // From autocomplete
  const [fromInput, setFromInput] = useState('')
  const [fromSuggestions, setFromSuggestions] = useState<Location[]>([])
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  const [fromLoading, setFromLoading] = useState(false)
  
  // To autocomplete
  const [toInput, setToInput] = useState('')
  const [toSuggestions, setToSuggestions] = useState<Location[]>([])
  const [showToSuggestions, setShowToSuggestions] = useState(false)
  const [toLoading, setToLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Check if click is outside both dropdowns
      if (!target.closest('.location-dropdown-from') && !target.closest('.location-dropdown-to')) {
        setShowFromSuggestions(false)
        setShowToSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Fetch locations from database
  const searchLocations = async (query: string, isFromField: boolean) => {
    if (query.length < 2) {
      if (isFromField) {
        setFromSuggestions([])
        setShowFromSuggestions(false)
      } else {
        setToSuggestions([])
        setShowToSuggestions(false)
      }
      return
    }

    if (isFromField) {
      setFromLoading(true)
    } else {
      setToLoading(true)
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
        .order('type', { ascending: false })
        .order('name')
        .limit(10)

      if (error) throw error

      if (isFromField) {
        setFromSuggestions(data || [])
        setShowFromSuggestions((data || []).length > 0)
      } else {
        setToSuggestions(data || [])
        setShowToSuggestions((data || []).length > 0)
      }
    } catch (error) {
      console.error('Error searching locations:', error)
      if (isFromField) {
        setFromSuggestions([])
        setShowFromSuggestions(false)
      } else {
        setToSuggestions([])
        setShowToSuggestions(false)
      }
    } finally {
      if (isFromField) {
        setFromLoading(false)
      } else {
        setToLoading(false)
      }
    }
  }

  // Debounced search for from field
  useEffect(() => {
    // Don't search if we have a selected location with matching name
    if (fromLocation && fromLocation.name === fromInput) {
      setShowFromSuggestions(false)
      return
    }

    const debounceTimer = setTimeout(() => {
      searchLocations(fromInput, true)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [fromInput, fromLocation])

  // Debounced search for to field
  useEffect(() => {
    // Don't search if we have a selected location with matching name
    if (toLocation && toLocation.name === toInput) {
      setShowToSuggestions(false)
      return
    }

    const debounceTimer = setTimeout(() => {
      searchLocations(toInput, false)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [toInput, toLocation])

  const handleFromInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFromInput(value)
    setFromLocation(null)
    // Show suggestions only when actually typing
    if (value.length >= 2) {
      setShowFromSuggestions(true)
    }
  }

  const handleToInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setToInput(value)
    setToLocation(null)
    // Show suggestions only when actually typing
    if (value.length >= 2) {
      setShowToSuggestions(true)
    }
  }

  const selectFromLocation = (location: Location) => {
    setFromLocation(location)
    setFromInput(location.name)
    setShowFromSuggestions(false)
    setFromSuggestions([]) // Clear suggestions immediately
  }

  const selectToLocation = (location: Location) => {
    setToLocation(location)
    setToInput(location.name)
    setShowToSuggestions(false)
    setToSuggestions([]) // Clear suggestions immediately
  }

  const handleSearch = () => {
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

  if (!mounted) {
    return <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
      {/* Location inputs */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* From location */}
        <div className="relative location-dropdown-from">
          <label className="block text-sm font-medium mb-2">From</label>
          <input
            type="text"
            value={fromInput}
            onChange={handleFromInput}
            placeholder="Airport, port, address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {fromLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
            </div>
          )}
          
          {showFromSuggestions && fromSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {fromSuggestions.map((location) => (
                <button
                  key={location.id}
                  onClick={() => selectFromLocation(location)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {getLocationIcon(location.type || 'default')}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {location.city ? `${location.city}, ` : ''}{location.country_code}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* To location */}
        <div className="relative location-dropdown-to">
          <label className="block text-sm font-medium mb-2">To</label>
          <input
            type="text"
            value={toInput}
            onChange={handleToInput}
            placeholder="Destination"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {toLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
            </div>
          )}
          
          {showToSuggestions && toSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {toSuggestions.map((location) => (
                <button
                  key={location.id}
                  onClick={() => selectToLocation(location)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {getLocationIcon(location.type || 'default')}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {location.city ? `${location.city}, ` : ''}{location.country_code}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Date and passengers */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Date picker */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            value={selectedDate}
            min={todayStr}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* Passenger selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Passengers</label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPassengers(Math.max(1, passengers - 1))}
              disabled={passengers <= 1}
              className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              -
            </button>
            <span className="w-8 text-center">{passengers}</span>
            <button
              onClick={() => setPassengers(Math.min(20, passengers + 1))}
              disabled={passengers >= 20}
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
            disabled={!fromLocation || !toLocation}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </div>
      </div>
      
      {/* Debug info */}
      <div className="mt-4 text-xs text-gray-500">
        From: {fromLocation?.name || 'Not selected'} | To: {toLocation?.name || 'Not selected'}
      </div>
    </div>
  )
}