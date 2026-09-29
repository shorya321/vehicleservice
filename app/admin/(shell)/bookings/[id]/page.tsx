import { Metadata } from 'next'
import { getBookingDetails } from '../actions'
import { BookingDetail } from './components/booking-detail'
import { JourneySwitcher } from './components/journey-switcher'
import { tripTypeLabel } from '@/lib/trips/display'
import { viewingJourney } from '@/lib/trips/journey-tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Booking Details - Admin',
  description: 'View and manage booking details',
}

interface BookingDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params
  
  let booking
  try {
    booking = await getBookingDetails(id)
  } catch (error) {
    console.error('Error fetching booking:', error)
    notFound()
  }

  if (!booking) {
    notFound()
  }

  const tripGroup = 'trip_group' in booking ? booking.trip_group : null
  const journey = tripGroup ? viewingJourney(tripGroup, booking.id) : null
  const reference = booking.trip_number || booking.booking_number

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/bookings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            {tripGroup ? (
              <>
                <h1 className="text-3xl font-bold tracking-tight">
                  {journey} · {tripTypeLabel({ trip_type: tripGroup.trip_type })} {tripGroup.group_number}
                </h1>
                <p className="text-sm text-muted-foreground font-mono">
                  {reference}{booking.trip_number ? ` · ${booking.booking_number}` : ''}
                </p>
                <p className="text-muted-foreground">
                  Viewing one journey of this trip. Vendor, payment and status actions below apply to it only.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight">
                  Booking #{reference}
                </h1>
                {booking.trip_number && (
                  <p className="text-sm text-muted-foreground font-mono">{booking.booking_number}</p>
                )}
                <p className="text-muted-foreground">
                  View and manage booking details
                </p>
              </>
            )}
          </div>
        </div>

        {tripGroup && <JourneySwitcher group={tripGroup} currentBookingId={booking.id} />}

        {/* Booking Details */}
        <BookingDetail booking={booking} />
      </div>
  )
}