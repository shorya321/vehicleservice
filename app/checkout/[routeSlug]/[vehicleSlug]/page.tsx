import { bookingToday } from "@/lib/utils/timezone"
import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
import { CheckoutWrapper } from '@/components/checkout/checkout-wrapper'
import { PublicLayout } from '@/components/layout/public-layout'
import { getVehicleType, getLocationDetails, getActiveAddons } from '../../actions'
import { createClient } from '@/lib/supabase/server'
import { parseRouteSlug } from '@/lib/utils/slug'
import { toStoredPhone } from '@/lib/validation/phone'
import { resolveRouteSlugs, resolveVehicleTypeSlug } from '@/lib/utils/slug-resolver'
import { getSeatedCount, resolveGuestsForVehicle } from '@/components/home/hero/guest-breakdown'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteSettings } from '@/lib/site-settings/server'
import { parseTripSearchParams } from '@/lib/trips/search-params'
import { quoteLegFare } from '@/lib/trips/pricing-server'
import { getRouteDurationMinutes } from '@/lib/trips/locations-server'
import type { CheckoutTrip } from '@/lib/trips/checkout-trip'

interface CheckoutRoutePageProps {
  params: Promise<{ routeSlug: string; vehicleSlug: string }>
  searchParams: Promise<{
    date?: string
    time?: string
    /** Total guests. The breakdown below is optional. Route cards and old links omit it. */
    passengers?: string
    adults?: string
    children?: string
    infants?: string
    /** Round trip: `trip=round_trip&return=yyyy-MM-dd[&returnTime=HH:mm]`. */
    trip?: string
    return?: string
    returnTime?: string
  }>
}

export async function generateMetadata({ params }: CheckoutRoutePageProps): Promise<Metadata> {
  const { routeSlug, vehicleSlug } = await params
  const parsed = parseRouteSlug(routeSlug)
  if (!parsed) {
    return { title: 'Checkout | Complete Your Booking' }
  }

  const resolved = await resolveRouteSlugs(parsed.origin, parsed.destination)
  const vehicle = await resolveVehicleTypeSlug(vehicleSlug)

  if (!resolved || !vehicle) {
    return { title: 'Checkout | Complete Your Booking' }
  }

  return {
    title: `Book ${vehicle.name} - ${resolved.origin.name} to ${resolved.destination.name} | Infinia Transfers`,
    description: `Complete your ${vehicle.name} transfer booking from ${resolved.origin.name} to ${resolved.destination.name}`,
  }
}

export default async function CheckoutRoutePage({ params, searchParams }: CheckoutRoutePageProps) {
  const { routeSlug, vehicleSlug } = await params
  const sp = await searchParams

  // Parse and resolve route slug
  const parsed = parseRouteSlug(routeSlug)
  if (!parsed) {
    redirect('/')
  }

  const [resolved, vehicleTypeRef] = await Promise.all([
    resolveRouteSlugs(parsed.origin, parsed.destination),
    resolveVehicleTypeSlug(vehicleSlug),
  ])

  if (!resolved || !vehicleTypeRef || resolved.type !== 'location') {
    redirect('/')
  }

  const fromId = resolved.origin.id
  const toId = resolved.destination.id

  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Use clean URL as return path
    const currentPath = `/checkout/${routeSlug}/${vehicleSlug}?${new URLSearchParams(sp as Record<string, string>).toString()}`
    redirect(`/auth/checkout-login?returnUrl=${encodeURIComponent(currentPath)}`)
  }

  // Get user profile with retry logic for new registrations
  let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Check user role - only customers can make bookings
  if (profile && profile.role !== 'customer') {
    if (profile.role === 'admin') {
      redirect('/admin/dashboard?error=Admin users cannot make bookings')
    } else if (profile.role === 'vendor') {
      redirect('/vendor/dashboard?error=Vendor users cannot make bookings')
    } else if (profile.role === 'business') {
      redirect('/business/dashboard?error=Business users cannot make bookings')
    }
  }

  // If profile doesn't exist or is incomplete, try to get data from user metadata
  if (!profile || (!profile.first_name && !profile.last_name && !profile.phone)) {
    const userData = user.user_metadata
    if (userData && (userData.first_name || userData.last_name || userData.phone)) {
      // Metadata may carry a malformed phone from an older signup - never trust it
      const metadataPhone = toStoredPhone(userData.phone)

      profile = {
        ...profile,
        id: user.id,
        email: user.email || profile?.email,
        first_name: userData.first_name || profile?.first_name || '',
        last_name: userData.last_name || profile?.last_name || '',
        phone: metadataPhone || profile?.phone || '',
        full_name:
          profile?.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
      } as typeof profile

      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone: metadataPhone,
        full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        role: profile?.role || 'customer',
      })
    }
  }

  // Fetch location, vehicle type, and addons details
  const [originLocation, destinationLocation, vehicleType, addonsData] = await Promise.all([
    getLocationDetails(fromId),
    getLocationDetails(toId),
    getVehicleType(vehicleTypeRef.id, fromId, toId),
    getActiveAddons(),
  ])

  if (!originLocation || !destinationLocation || !vehicleType) {
    redirect('/')
  }

  // Calculate distance if coordinates are available
  let calculatedDistance = 0
  if (
    originLocation.latitude &&
    originLocation.longitude &&
    destinationLocation.latitude &&
    destinationLocation.longitude
  ) {
    const supabaseClient = await createClient()
    const { data: distanceData } = await supabaseClient.rpc('calculate_distance_km', {
      lat1: originLocation.latitude,
      lon1: originLocation.longitude,
      lat2: destinationLocation.latitude,
      lon2: destinationLocation.longitude,
    })
    calculatedDistance = distanceData || 0
  }

  // Create route details from location data
  const routeDetails = {
    id: `${fromId}-${toId}`,
    route_name: `${originLocation.name} to ${destinationLocation.name}`,
    distance_km: calculatedDistance,
    estimated_duration_minutes: 30,
    base_price: vehicleType.price,
    origin: {
      id: originLocation.id,
      name: originLocation.name,
      city: originLocation.city || '',
      country_code: originLocation.country_code || 'US',
    },
    destination: {
      id: destinationLocation.id,
      name: destinationLocation.name,
      city: destinationLocation.city || '',
      country_code: destinationLocation.country_code || 'US',
    },
  }

  // Parse date and time
  const pickupDate = sp.date || bookingToday()
  const pickupTime = sp.time || '10:00'
  // Resolve the breakdown and the total together, clamped to the vehicle, so they can never
  // contradict. Search filters by capacity, so clamping normally only fires for stale or
  // hand-crafted links.
  const guests = resolveGuestsForVehicle(sp, vehicleType.passenger_capacity)
  const passengers = getSeatedCount(guests)

  // "Change vehicle" goes back to this route's results rather than popping history, which
  // sends a direct arrival off site.
  const changeParams = new URLSearchParams({
    date: pickupDate,
    passengers: String(passengers),
    adults: String(guests.adults),
    children: String(guests.children),
    infants: String(guests.infants),
  })
  // Round trip: the reverse route as a second journey, priced strictly (no placeholder fare).
  const requestedTrip = parseTripSearchParams(sp)
  let checkoutTrip: CheckoutTrip | undefined
  if (requestedTrip.trip === 'round_trip' && requestedTrip.returnDate) {
    const settings = await getSiteSettings()
    if (settings.trip_types.round_trip_enabled) {
      const adminClient = createAdminClient()
      const { data: multiplierRow } = await adminClient
        .from('vehicle_types')
        .select('price_multiplier')
        .eq('id', vehicleTypeRef.id)
        .single()
      const multiplier = Number(multiplierRow?.price_multiplier) || 1
      const [outboundFare, returnFare, outboundMinutes, returnMinutes] = await Promise.all([
        quoteLegFare(adminClient, fromId, toId, multiplier),
        quoteLegFare(adminClient, toId, fromId, multiplier),
        getRouteDurationMinutes(adminClient, fromId, toId),
        getRouteDurationMinutes(adminClient, toId, fromId),
      ])

      changeParams.set('trip', 'round_trip')
      changeParams.set('return', requestedTrip.returnDate)
      // A leg with no price: back to the results, where the card says why. Never a
      // silent downgrade to a one-way booking the customer did not ask for.
      if (outboundFare === null || returnFare === null) {
        redirect(`/search/${routeSlug}?${changeParams.toString()}`)
      }

      checkoutTrip = {
        kind: 'round_trip',
        discountPercent: settings.trip_types.round_trip_discount_percent,
        bufferMinutes: settings.trip_types.leg_buffer_minutes,
        maxLegs: 2,
        legs: [
          {
            fromId,
            fromName: originLocation.name,
            toId,
            toName: destinationLocation.name,
            date: pickupDate,
            time: pickupTime,
            baseFare: outboundFare,
            durationMinutes: outboundMinutes,
          },
          {
            fromId: toId,
            fromName: destinationLocation.name,
            toId: fromId,
            toName: originLocation.name,
            date: requestedTrip.returnDate < pickupDate ? pickupDate : requestedTrip.returnDate,
            time: requestedTrip.returnTime,
            baseFare: returnFare,
            durationMinutes: returnMinutes,
          },
        ],
      }
    }
  }

  const changeHref = `/search/${routeSlug}?${changeParams.toString()}`

  return (
    <PublicLayout>
      {/* CheckoutWrapper emits its own full-bleed bands, each with its own container, so
          this shell supplies only the page ground. `min-h-screen` would overshoot by the
          80px of `main.pt-20` and paint `--black-void` under the last band. */}
      <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-[var(--black-void)]">
          {/* The stepper and heading live inside CheckoutWrapper, which owns the wizard
              step. They used to render here with a hardcoded step that never advanced. */}
          <CheckoutWrapper
            route={routeDetails}
            vehicleType={vehicleType}
            initialDate={pickupDate}
            initialTime={pickupTime}
            initialPassengers={passengers}
            initialGuests={guests}
            user={user}
            profile={profile}
            addonsByCategory={addonsData.addonsByCategory}
            changeHref={changeHref}
            trip={checkoutTrip}
          />
      </div>
    </PublicLayout>
  )
}
