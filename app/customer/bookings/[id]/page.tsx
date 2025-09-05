import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCustomer } from '@/lib/auth/user-actions'
import { CustomerLayout } from '@/components/layout/customer-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Luggage,
  Mail,
  Phone,
  CreditCard,
  Car,
  ArrowLeft,
  Download,
  Printer,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Booking Details | View Your Transfer',
  description: 'View detailed information about your booking',
}

interface BookingDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

async function getBookingDetails(bookingId: string, userId: string) {
  const adminClient = createAdminClient()

  const { data: booking, error } = await adminClient
    .from('bookings')
    .select(`
      *,
      booking_passengers (
        first_name,
        last_name,
        email,
        phone,
        is_primary
      ),
      booking_amenities (
        amenity_type,
        quantity,
        price
      ),
      vehicle_type:vehicle_types (
        id,
        name,
        passenger_capacity,
        luggage_capacity,
        description,
        image_url
      )
    `)
    .eq('id', bookingId)
    .eq('customer_id', userId)
    .single()

  if (error || !booking) {
    return null
  }

  return booking
}

export default async function BookingDetailsPage({ params }: BookingDetailsPageProps) {
  const { id } = await params
  const user = await requireCustomer()
  
  const booking = await getBookingDetails(id, user.id)

  if (!booking) {
    notFound()
  }

  const primaryPassenger = booking.booking_passengers?.find((p: any) => p.is_primary)
  const otherPassengers = booking.booking_passengers?.filter((p: any) => !p.is_primary) || []

  const amenities = booking.booking_amenities || []
  const childSeats = amenities.filter((a: any) =>
    a.amenity_type === 'child_seat_infant' || a.amenity_type === 'child_seat_booster'
  )
  const extraLuggage = amenities.find((a: any) => a.amenity_type === 'extra_luggage')

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
  const canCancel = !isPastBooking && booking.booking_status === 'confirmed' && 
    (pickupDate.getTime() - new Date().getTime()) > 24 * 60 * 60 * 1000

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/customer/bookings">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Booking #{booking.booking_number}</h1>
              <p className="text-muted-foreground">
                Booked on {format(new Date(booking.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Booking Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusColor(booking.booking_status)} className="text-sm">
                {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={getPaymentStatusColor(booking.payment_status)} className="text-sm">
                  <CreditCard className="h-3 w-3 mr-1" />
                  {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                </Badge>
                {booking.payment_status === 'completed' && (
                  <span className="text-sm text-muted-foreground">
                    Paid {formatCurrency(booking.total_price)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Journey & Vehicle Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Journey Details */}
            <Card>
              <CardHeader>
                <CardTitle>Journey Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {format(pickupDate, 'EEEE, MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">
                          {format(pickupDate, 'HH:mm')} (24-hour format)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Passengers</p>
                        <p className="font-medium">{booking.passenger_count}</p>
                      </div>
                    </div>
                    {booking.luggage_count > 0 && (
                      <div className="flex items-center gap-2">
                        <Luggage className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Luggage</p>
                          <p className="font-medium">{booking.luggage_count}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Pickup Location</p>
                      <p className="text-sm text-muted-foreground">{booking.pickup_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Drop-off Location</p>
                      <p className="text-sm text-muted-foreground">{booking.dropoff_address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            {booking.vehicle_type && (
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    {booking.vehicle_type.image_url && (
                      <img
                        src={booking.vehicle_type.image_url}
                        alt={booking.vehicle_type.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">{booking.vehicle_type.name}</p>
                      </div>
                      {booking.vehicle_type.description && (
                        <p className="text-sm text-muted-foreground">
                          {booking.vehicle_type.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>Up to {booking.vehicle_type.passenger_capacity} passengers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Luggage className="h-3 w-3" />
                          <span>Up to {booking.vehicle_type.luggage_capacity} luggage</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Passenger Information */}
            <Card>
              <CardHeader>
                <CardTitle>Passenger Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {primaryPassenger && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Primary Contact</p>
                      <Badge variant="secondary" className="text-xs">Primary</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">
                          {primaryPassenger.first_name} {primaryPassenger.last_name}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Contact</p>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{primaryPassenger.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{primaryPassenger.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {otherPassengers.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <p className="font-medium">Other Passengers</p>
                      {otherPassengers.map((passenger: any, index: number) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium">
                            {passenger.first_name} {passenger.last_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Special Requests */}
            {booking.customer_notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Special Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{booking.customer_notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Payment Summary & Actions */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base Price</span>
                    <span>{formatCurrency(booking.base_price)}</span>
                  </div>

                  {childSeats.length > 0 && (
                    <>
                      {childSeats.map((seat: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {seat.amenity_type === 'child_seat_infant' ? 'Infant Seat' : 'Booster Seat'}
                            {seat.quantity > 1 ? ` x${seat.quantity}` : ''}
                          </span>
                          <span>{formatCurrency(seat.price)}</span>
                        </div>
                      ))}
                    </>
                  )}

                  {extraLuggage && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Extra Luggage x{extraLuggage.quantity}
                      </span>
                      <span>{formatCurrency(extraLuggage.price)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-semibold">
                    <span>Total Amount</span>
                    <span className="text-lg">{formatCurrency(booking.total_price)}</span>
                  </div>

                  {booking.payment_status === 'completed' && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ Payment confirmed
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {booking.payment_status === 'completed' && (
                  <Button variant="outline" className="w-full">
                    View Receipt
                  </Button>
                )}
                
                {booking.booking_status === 'pending' && booking.payment_status === 'processing' && (
                  <Link href={`/payment?booking=${booking.id}`} className="block">
                    <Button className="w-full">
                      Complete Payment
                    </Button>
                  </Link>
                )}
                
                {canCancel && (
                  <Button variant="destructive" className="w-full">
                    Cancel Booking
                  </Button>
                )}
                
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            {/* Cancellation Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cancellation Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Free cancellation up to 24 hours before pickup</li>
                  <li>• 50% refund within 24 hours of pickup</li>
                  <li>• No refund after pickup time</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CustomerLayout>
  )
}