import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { PublicLayout } from '@/components/layout/public-layout'
import { createAdminClient } from '@/lib/supabase/admin'
import { ConfirmationContent } from './components/confirmation-content'
import { getExchangeRatesObject, getDefaultCurrency } from '@/lib/currency/server'
import { CURRENCY_COOKIE_NAME } from '@/lib/currency/types'

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
        price,
        addon_id,
        addon:addons (
          id,
          name,
          icon
        )
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
  const cookieStore = await cookies()

  if (!params.booking) {
    notFound()
  }

  const booking = await getBookingDetails(params.booking)

  if (!booking) {
    notFound()
  }

  // Fetch currency data
  const [rates, defaultCurrency] = await Promise.all([
    getExchangeRatesObject(),
    getDefaultCurrency(),
  ])

  // Get user's currency preference from cookie
  const currencyCookie = cookieStore.get(CURRENCY_COOKIE_NAME)
  const currentCurrency = currencyCookie?.value || defaultCurrency

  // Get primary passenger
  const primaryPassenger = booking.booking_passengers?.find((p: any) => p.is_primary)

  // Format amenities
  const amenities = booking.booking_amenities || []
  const childSeats = amenities.filter((a: any) =>
    a.amenity_type === 'child_seat_infant' || a.amenity_type === 'child_seat_booster'
  )
  const extraLuggage = amenities.find((a: any) => a.amenity_type === 'extra_luggage')
  const addons = amenities.filter((a: any) => a.amenity_type === 'addon' && a.addon)

  return (
    <PublicLayout>
      <ConfirmationContent
        booking={booking}
        primaryPassenger={primaryPassenger}
        childSeats={childSeats}
        extraLuggage={extraLuggage}
        addons={addons}
        currentCurrency={currentCurrency}
        rates={rates}
      />
    </PublicLayout>
  )
}