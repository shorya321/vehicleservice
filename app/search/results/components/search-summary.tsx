import { format } from 'date-fns'
import { MapPin, Calendar, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getLocationDetails } from '../actions'

interface SearchSummaryProps {
  originId: string
  destinationId: string
  date: Date
  passengers: number
}

export async function SearchSummary({ originId, destinationId, date, passengers }: SearchSummaryProps) {
  const [origin, destination] = await Promise.all([
    getLocationDetails(originId),
    getLocationDetails(destinationId)
  ])

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 flex-shrink-0" />
            <div>
              <div className="text-sm opacity-80">Route</div>
              <div className="font-semibold">
                {origin?.city} → {destination?.city}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 flex-shrink-0" />
            <div>
              <div className="text-sm opacity-80">Date</div>
              <div className="font-semibold">
                {format(date, 'EEE, MMM d, yyyy')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 flex-shrink-0" />
            <div>
              <div className="text-sm opacity-80">Passengers</div>
              <div className="font-semibold">
                {passengers} {passengers === 1 ? 'Passenger' : 'Passengers'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}