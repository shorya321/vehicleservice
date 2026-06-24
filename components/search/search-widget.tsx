'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LocationSearchAutocomplete } from './location-search-autocomplete'
import { PassengerSelector } from './passenger-selector'
import { DatePicker } from './date-picker'
import { cn } from '@/lib/utils'
import type { LocationSearchResult } from '@/lib/types/location'
import { toast } from 'sonner'
import { buildSearchUrl } from '@/lib/utils/url-builder'

interface SearchWidgetProps {
  className?: string
  onSearch?: (params: SearchParams) => void
  defaultOrigin?: LocationSearchResult
  defaultDestination?: LocationSearchResult
}

export interface SearchParams {
  originId: string
  destinationId: string
  date: Date
  passengers: number
}

export function SearchWidget({ className, onSearch, defaultOrigin, defaultDestination }: SearchWidgetProps) {
  const router = useRouter()
  const [originLocation, setOriginLocation] = useState<LocationSearchResult | null>(defaultOrigin || null)
  const [destinationLocation, setDestinationLocation] = useState<LocationSearchResult | null>(defaultDestination || null)
  const [originInput, setOriginInput] = useState(defaultOrigin?.name || '')
  const [destInput, setDestInput] = useState(defaultDestination?.name || '')
  const [date, setDate] = useState<Date>(new Date())
  const [passengers, setPassengers] = useState(2)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!originLocation) {
      toast.error('Please select an origin location')
      return
    }

    setLoading(true)

    if (destinationLocation) {
      if (originLocation.id === destinationLocation.id) {
        toast.error('Origin and destination must be different')
        setLoading(false)
        return
      }
      router.push(buildSearchUrl(originLocation.slug, destinationLocation.slug, {
        date: format(date, 'yyyy-MM-dd'),
        passengers: passengers,
      }))
    } else {
      // No destination - fall back to old URL pattern
      const params = new URLSearchParams({
        from: originLocation.id,
        date: format(date, 'yyyy-MM-dd'),
        passengers: passengers.toString(),
      })
      router.push(`/search/results?${params.toString()}`)
    }
    
    setLoading(false)
  }

  const handleSwapLocations = () => {
    const tempLoc = originLocation
    const tempInput = originInput
    setOriginLocation(destinationLocation)
    setOriginInput(destInput)
    setDestinationLocation(tempLoc)
    setDestInput(tempInput)
  }

  return (
    <div className={cn(
      "bg-card rounded-lg shadow-lg p-6 space-y-4",
      className
    )}>
      <div className="grid gap-4 md:grid-cols-[1fr,auto,1fr] md:items-center">
        <LocationSearchAutocomplete
          id="search-origin"
          value={originInput}
          onChange={(v) => {
            setOriginInput(v)
            setOriginLocation(prev => prev && prev.name === v ? prev : null)
          }}
          onSelect={(loc) => {
            setOriginLocation(loc)
            setOriginInput(loc.name)
          }}
          selectedLocation={originLocation}
          placeholder="From (airport, port, address)"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden md:flex"
          onClick={handleSwapLocations}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>

        <LocationSearchAutocomplete
          id="search-dest"
          value={destInput}
          onChange={(v) => {
            setDestInput(v)
            setDestinationLocation(prev => prev && prev.name === v ? prev : null)
          }}
          onSelect={(loc) => {
            setDestinationLocation(loc)
            setDestInput(loc.name)
          }}
          selectedLocation={destinationLocation}
          placeholder="To (optional)"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr,1fr,auto]">
        <DatePicker
          value={date}
          onChange={setDate}
        />

        <div className="border rounded-md px-3 py-2">
          <PassengerSelector
            value={passengers}
            onChange={setPassengers}
          />
        </div>

        <Button
          onClick={handleSearch}
          disabled={loading || !originLocation}
          size="lg"
          className="md:px-8"
        >
          {loading ? 'Searching...' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}