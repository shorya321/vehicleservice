'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, ArrowRight, Plus, Minus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function SimpleSearchWidget() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [originId, setOriginId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [date, setDate] = useState<Date>(new Date())
  const [passengers, setPassengers] = useState(2)
  const [showCalendar, setShowCalendar] = useState(false)
  const [loading, setLoading] = useState(false)

  // Ensure component is mounted before rendering interactive elements
  useEffect(() => {
    queueMicrotask(() => setMounted(true))
  }, [])

  const handleSearch = () => {
    if (!originId) {
      toast.error('Please enter origin location')
      return
    }

    setLoading(true)
    
    // For now, just use dummy IDs
    const params = new URLSearchParams({
      from: 'clz41xqmv000212xoh95tqytk', // Dummy origin ID
      date: format(date, 'yyyy-MM-dd'),
      passengers: passengers.toString()
    })

    if (destinationId) {
      params.append('to', 'clz41xqn2000412xo7qvcqszb') // Dummy destination ID
    }

    router.push(`/search/results?${params.toString()}`)
  }

  if (!mounted) {
    return (
      <div className="bg-card rounded-lg shadow-lg p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow-lg p-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-[1fr,auto,1fr] md:items-center">
        <Input
          placeholder="From (airport, port, address)"
          value={originId}
          onChange={(e) => setOriginId(e.target.value)}
          className="w-full"
        />
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden md:flex"
          onClick={() => {
            const temp = originId
            setOriginId(destinationId)
            setDestinationId(temp)
          }}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>

        <Input
          placeholder="To (optional)"
          value={destinationId}
          onChange={(e) => setDestinationId(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr,1fr,auto]">
        {/* Date Picker */}
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(date, 'PPP')}
          </Button>
          
          {showCalendar && (
            <div className="absolute top-full left-0 z-50 mt-2 w-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate)
                    setShowCalendar(false)
                  }
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </div>
          )}
        </div>

        {/* Passenger Selector */}
        <div className="border rounded-md px-3 py-2 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Passengers</span>
          <div className="flex items-center gap-1 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPassengers(Math.max(1, passengers - 1))}
              disabled={passengers <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="w-12 text-center font-medium">
              {passengers}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPassengers(Math.min(8, passengers + 1))}
              disabled={passengers >= 8}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button
          onClick={handleSearch}
          disabled={loading || !originId}
          size="lg"
          className="md:px-8"
        >
          {loading ? 'Searching...' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}