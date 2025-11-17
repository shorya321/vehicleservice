'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleLocationAutocomplete as LocationAutocomplete } from './simple-location-autocomplete'
import { PassengerSelector } from './passenger-selector'
import { DatePicker } from './date-picker'
import { cn } from '@/lib/utils'
import { Location } from '@/lib/types/location'
import { toast } from 'sonner'

interface SearchWidgetProps {
  className?: string
  onSearch?: (params: SearchParams) => void
  defaultOrigin?: Location
  defaultDestination?: Location
}

export interface SearchParams {
  originId: string
  destinationId: string
  date: Date
  passengers: number
}

export function SearchWidget({ className, onSearch, defaultOrigin, defaultDestination }: SearchWidgetProps) {
  const router = useRouter()
  const [originLocation, setOriginLocation] = useState<Location | null>(defaultOrigin || null)
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(defaultDestination || null)
  const [date, setDate] = useState<Date>(new Date())
  const [passengers, setPassengers] = useState(2)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!originLocation) {
      toast.error('Please select an origin location')
      return
    }

    setLoading(true)

    // Build search parameters
    const params = new URLSearchParams({
      from: originLocation.id,
      date: format(date, 'yyyy-MM-dd'),
      passengers: passengers.toString()
    })

    // Add destination if selected
    if (destinationLocation) {
      if (originLocation.id === destinationLocation.id) {
        toast.error('Origin and destination must be different')
        setLoading(false)
        return
      }
      params.append('to', destinationLocation.id)
    }

    // Navigate to unified search results page
    router.push(`/search/results?${params.toString()}`)
    
    setLoading(false)
  }

  const handleSwapLocations = () => {
    const temp = originLocation
    setOriginLocation(destinationLocation)
    setDestinationLocation(temp)
  }

  return (
    <div className={cn(
      "bg-card rounded-lg shadow-lg p-6 space-y-4",
      className
    )}>
      <div className="grid gap-4 md:grid-cols-[1fr,auto,1fr] md:items-center">
        <LocationAutocomplete
          value={originLocation?.name || ''}
          onSelect={setOriginLocation}
          placeholder="From (airport, port, address)"
          className="w-full"
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

        <LocationAutocomplete
          value={destinationLocation?.name || ''}
          onSelect={setDestinationLocation}
          placeholder="To (optional)"
          className="w-full"
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