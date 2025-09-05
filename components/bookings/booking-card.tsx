import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Car,
  CreditCard,
  FileText,
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface BookingCardProps {
  booking: {
    id: string
    booking_number: string
    pickup_datetime: string
    pickup_address: string
    dropoff_address: string
    total_price: number
    booking_status: string
    payment_status: string
    vehicle_type?: {
      name: string
    }
  }
}

export function BookingCard({ booking }: BookingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default'
      case 'completed':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      case 'pending':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'processing':
        return 'secondary'
      case 'failed':
        return 'destructive'
      case 'refunded':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const pickupDate = new Date(booking.pickup_datetime)
  const isPastBooking = pickupDate < new Date()

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">
              Booking #{booking.booking_number}
            </h3>
            <div className="flex gap-2 mt-2">
              <Badge variant={getStatusColor(booking.booking_status)}>
                {booking.booking_status}
              </Badge>
              <Badge variant={getPaymentStatusColor(booking.payment_status)}>
                <CreditCard className="h-3 w-3 mr-1" />
                {booking.payment_status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(booking.total_price)}</p>
            {booking.vehicle_type && (
              <p className="text-sm text-muted-foreground flex items-center justify-end gap-1 mt-1">
                <Car className="h-3 w-3" />
                {booking.vehicle_type.name}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Date and Time */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(pickupDate, 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(pickupDate, 'HH:mm')}</span>
          </div>
        </div>

        {/* Route */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">From</p>
              <p className="text-sm text-muted-foreground">{booking.pickup_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">To</p>
              <p className="text-sm text-muted-foreground">{booking.dropoff_address}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link href={`/customer/bookings/${booking.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          
          {booking.payment_status === 'completed' && (
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Receipt
            </Button>
          )}
          
          {!isPastBooking && booking.booking_status === 'confirmed' && (
            <Button variant="outline" size="sm" className="text-destructive">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}