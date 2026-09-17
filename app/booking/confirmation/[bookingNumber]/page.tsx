import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicLayout } from '@/components/layout/public-layout'
import { RouteBandMap } from '@/app/search/results/components/route-band-map'
import { ConfirmationContent } from '../components/confirmation-content'
import { getConfirmationBooking, getRouteTiming } from '../lib/get-confirmation-booking'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Booking Confirmed | Your Transfer is Booked',
  description: 'Your transfer booking has been confirmed',
}

interface ConfirmationRoutePageProps {
  params: Promise<{ bookingNumber: string }>
}

export default async function ConfirmationRoutePage({ params }: ConfirmationRoutePageProps) {
  const { bookingNumber } = await params

  if (!bookingNumber) {
    notFound()
  }

  const booking = await getConfirmationBooking(bookingNumber)

  if (!booking) {
    notFound()
  }

  const route = await getRouteTiming(booking.from_location_id, booking.to_location_id)

  const primaryPassenger = booking.booking_passengers?.find((p: any) => p.is_primary)
  const amenities = booking.booking_amenities || []
  const childSeats = amenities.filter(
    (a: any) => a.amenity_type === 'child_seat_infant' || a.amenity_type === 'child_seat_booster'
  )
  const addons = amenities.filter((a: any) => a.amenity_type === 'addon' && a.addon)

  return (
    <PublicLayout>
      <ConfirmationContent
        booking={booking}
        primaryPassenger={primaryPassenger}
        childSeats={childSeats}
        addons={addons}
        route={route}
        // Server-rendered and handed in as a slot: the map's geometry is built at module load and
        // must not ship in this client component's bundle. Same arrangement as the search page.
        routeMap={<RouteBandMap />}
      />
    </PublicLayout>
  )
}
