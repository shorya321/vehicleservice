import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PublicLayout } from '@/components/layout/public-layout'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils'
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Luggage,
  Mail,
  Phone,
  Printer,
  Download
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Booking Confirmed | Your Transfer is Booked',
  description: 'Your transfer booking has been confirmed',
}

interface ConfirmationPageProps {
  searchParams: Promise<{
    booking?: string
  }>
}

async function getBookingDetails(bookingNumber: string) {
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
        description
      )
    `)
    .eq('booking_number', bookingNumber)
    .single()

  if (error || !booking) {
    return null
  }

  return booking
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const params = await searchParams
  
  if (!params.booking) {
    notFound()
  }

  const booking = await getBookingDetails(params.booking)
  
  if (!booking) {
    notFound()
  }

  // Get primary passenger
  const primaryPassenger = booking.booking_passengers?.find((p: any) => p.is_primary)

  // Format amenities
  const amenities = booking.booking_amenities || []
  const childSeats = amenities.filter((a: any) => 
    a.amenity_type === 'child_seat_infant' || a.amenity_type === 'child_seat_booster'
  )
  const extraLuggage = amenities.find((a: any) => a.amenity_type === 'extra_luggage')

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Your transfer has been successfully booked. We've sent a confirmation email to {primaryPassenger?.email}
          </p>
        </div>

        {/* Booking Details Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Booking Details</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Reference: <span className="font-mono font-semibold">{booking.booking_number}</span>
                </p>
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
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Route Information */}
            <div>
              <h3 className="font-semibold mb-3">Journey Details</h3>
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
            </div>

            <Separator />

            {/* Date, Time & Vehicle */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Pickup Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(booking.pickup_datetime), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(booking.pickup_datetime), 'HH:mm')} (24-hour format)
                    </span>
                  </div>
                </div>
              </div>

              {booking.vehicle_type && (
                <div>
                  <h3 className="font-semibold mb-3">Vehicle Type</h3>
                  <div className="space-y-2">
                    <p className="font-medium">{booking.vehicle_type.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>Up to {booking.vehicle_type.passenger_capacity}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Luggage className="h-4 w-4" />
                        <span>Up to {booking.vehicle_type.luggage_capacity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Passenger Information */}
            {primaryPassenger && (
              <>
                <div>
                  <h3 className="font-semibold mb-3">Passenger Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">
                        {primaryPassenger.first_name} {primaryPassenger.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <div className="space-y-1">
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
                </div>
                <Separator />
              </>
            )}

            {/* Booking Summary */}
            <div>
              <h3 className="font-semibold mb-3">Booking Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {booking.passenger_count} Passenger{booking.passenger_count > 1 ? 's' : ''}
                  </span>
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

                <Separator className="my-2" />
                
                <div className="flex justify-between font-semibold">
                  <span>Total Paid</span>
                  <span className="text-lg">{formatCurrency(booking.total_price)}</span>
                </div>

                {booking.payment_status === 'completed' && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    ✓ Payment confirmed
                  </p>
                )}
              </div>
            </div>

            {/* Special Requests */}
            {booking.customer_notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Special Requests</h3>
                  <p className="text-sm text-muted-foreground">{booking.customer_notes}</p>
                </div>
              </>
            )}

            {/* Important Information */}
            <Separator />
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Important Information</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Please be ready at your pickup location 5 minutes before the scheduled time</li>
                <li>• Your driver will wait up to 15 minutes after the scheduled pickup time</li>
                <li>• Free cancellation up to 24 hours before pickup</li>
                <li>• For any changes or inquiries, please contact our support team</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Link href="/">
            <Button variant="outline">Book Another Transfer</Button>
          </Link>
          <Link href="/customer/dashboard">
            <Button>View My Bookings</Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  )
}