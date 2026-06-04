'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Users, Search, CalendarDays } from 'lucide-react'
import { FormDatePicker } from '@/components/ui/form-date-picker'
import { parse } from 'date-fns'
import { useRouter } from 'next/navigation'
import { ZoneLocation, DestinationZone } from '../actions'
import { format } from 'date-fns'

interface QuickBookingProps {
  locations: ZoneLocation[]
  destinations: DestinationZone[]
}

export function QuickBooking({ locations, destinations }: QuickBookingProps) {
  const router = useRouter()
  const [fromLocation, setFromLocation] = useState('')
  const [toZone, setToZone] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [passengers, setPassengers] = useState('2')

  const handleSearch = () => {
    if (!fromLocation) {
      return
    }

    const params = new URLSearchParams({
      from: fromLocation,
      date: date,
      passengers: passengers
    })

    if (toZone) {
      // If destination zone is selected, we need to pick a location from that zone
      // For now, we'll redirect to search with the from location
      params.append('toZone', toZone)
    }

    router.push(`/search/results?${params.toString()}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Quick Booking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="from">
              <MapPin className="inline h-3 w-3 mr-1" />
              From Location
            </Label>
            <Select value={fromLocation} onValueChange={setFromLocation}>
              <SelectTrigger id="from">
                <SelectValue placeholder="Select pickup location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">
              <MapPin className="inline h-3 w-3 mr-1" />
              To Zone (Optional)
            </Label>
            <Select value={toZone} onValueChange={setToZone}>
              <SelectTrigger id="to">
                <SelectValue placeholder="Select destination zone" />
              </SelectTrigger>
              <SelectContent>
                {destinations.map((destination) => (
                  <SelectItem key={destination.id} value={destination.id}>
                    {destination.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">
              <CalendarDays className="inline h-3 w-3 mr-1" />
              Date
            </Label>
            <FormDatePicker
              value={date ? parse(date, 'yyyy-MM-dd', new Date()) : undefined}
              onChange={(d) => setDate(d ? format(d, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              placeholder="Select date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passengers">
              <Users className="inline h-3 w-3 mr-1" />
              Passengers
            </Label>
            <Select value={passengers} onValueChange={setPassengers}>
              <SelectTrigger id="passengers">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'Passenger' : 'Passengers'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleSearch}
          className="w-full"
          size="lg"
          disabled={!fromLocation}
        >
          <Search className="mr-2 h-4 w-4" />
          Search Available Transfers
        </Button>
      </CardContent>
    </Card>
  )
}