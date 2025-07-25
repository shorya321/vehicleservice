'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Location {
  id: string
  name: string
  city: string
  country_code: string
}

// Mock data for locations
const mockLocations: Location[] = [
  { id: '8271bb55-fdad-4d32-88e4-62bbc23357e4', name: 'Jassur', city: 'Himachal Pradesh', country_code: 'IN' },
  { id: 'cf41e164-d2b0-41cc-aafb-b1a3c804976e', name: 'Mamoon', city: 'Punjab', country_code: 'IN' },
  { id: '480b52ee-4fa3-4974-8cbe-57e7daec4946', name: 'Manwal', city: 'Punjab', country_code: 'IN' },
  { id: '108e6129-3483-4546-bb54-3aacec36097b', name: 'Sheela chownk', city: 'Himachal Pradesh', country_code: 'IN' },
  { id: 'mock-id-1', name: 'Delhi Airport', city: 'Delhi', country_code: 'IN' },
  { id: 'mock-id-2', name: 'Mumbai Airport', city: 'Mumbai', country_code: 'IN' },
  { id: 'mock-id-3', name: 'Chandigarh Airport', city: 'Chandigarh', country_code: 'IN' },
]

export function WorkingSearchWidget() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [fromLocation, setFromLocation] = useState<Location | null>(null)
  const [toLocation, setToLocation] = useState<Location | null>(null)
  const [passengers, setPassengers] = useState(2)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDate, setSelectedDate] = useState('2025-07-17')
  
  // From autocomplete
  const [fromInput, setFromInput] = useState('')
  const [fromSuggestions, setFromSuggestions] = useState<Location[]>([])
  const [showFromSuggestions, setShowFromSuggestions] = useState(false)
  
  // To autocomplete
  const [toInput, setToInput] = useState('')
  const [toSuggestions, setToSuggestions] = useState<Location[]>([])
  const [showToSuggestions, setShowToSuggestions] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filterLocations = (query: string): Location[] => {
    if (query.length < 2) return []
    
    return mockLocations.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.city.toLowerCase().includes(query.toLowerCase())
    )
  }

  const handleFromInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFromInput(value)
    setFromLocation(null)
    
    const suggestions = filterLocations(value)
    setFromSuggestions(suggestions)
    setShowFromSuggestions(value.length >= 2)
  }

  const handleToInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setToInput(value)
    setToLocation(null)
    
    const suggestions = filterLocations(value)
    setToSuggestions(suggestions)
    setShowToSuggestions(value.length >= 2)
  }

  const selectFromLocation = (location: Location) => {
    setFromLocation(location)
    setFromInput(location.name)
    setShowFromSuggestions(false)
  }

  const selectToLocation = (location: Location) => {
    setToLocation(location)
    setToInput(location.name)
    setShowToSuggestions(false)
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
        {/* From location */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2">From</label>
          <input
            type="text"
            value={fromInput}
            onChange={handleFromInput}
            onFocus={() => setShowFromSuggestions(fromInput.length >= 2)}
            placeholder="Airport, port, address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          
          {showFromSuggestions && fromSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {fromSuggestions.map((location) => (
                <button
                  key={location.id}
                  onClick={() => selectFromLocation(location)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                >
                  <div className="font-medium">{location.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {location.city}, {location.country_code}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* To location */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2">To (Optional)</label>
          <input
            type="text"
            value={toInput}
            onChange={handleToInput}
            onFocus={() => setShowToSuggestions(toInput.length >= 2)}
            placeholder="Destination"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          
          {showToSuggestions && toSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {toSuggestions.map((location) => (
                <button
                  key={location.id}
                  onClick={() => selectToLocation(location)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                >
                  <div className="font-medium">{location.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {location.city}, {location.country_code}
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
          <button
            onClick={() => setShowCalendar(!showCalendar)}
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
                
                {Array.from({ length: 31 }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => {
                      setSelectedDate(`2025-07-${String(i + 1).padStart(2, '0')}`)
                      setShowCalendar(false)
                    }}
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
              onClick={() => setPassengers(Math.max(1, passengers - 1))}
              disabled={passengers <= 1}
              className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              -
            </button>
            <span className="w-8 text-center">{passengers}</span>
            <button
              onClick={() => setPassengers(Math.min(8, passengers + 1))}
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
      
      {/* Debug info */}
      <div className="mt-4 text-xs text-gray-500">
        From: {fromLocation?.name || 'Not selected'} | To: {toLocation?.name || 'Not selected'}
      </div>
    </div>
  )
}