import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
import { CheckoutWrapper } from '@/components/checkout/checkout-wrapper'
import { CheckoutHeading } from '@/components/checkout/checkout-heading'
import { ProgressBar } from '@/components/checkout/progress-bar'
import { PublicLayout } from '@/components/layout/public-layout'
import { getVehicleType, getLocationDetails, getActiveAddons, getExtraItemPrices } from '../../actions'
import { createClient } from '@/lib/supabase/server'
import { parseRouteSlug } from '@/lib/utils/slug'
import { toStoredPhone } from '@/lib/validation/phone'
import { resolveRouteSlugs, resolveVehicleTypeSlug } from '@/lib/utils/slug-resolver'

interface CheckoutRoutePageProps {
  params: Promise<{ routeSlug: string; vehicleSlug: string }>
  searchParams: Promise<{
    date?: string
    time?: string
    passengers?: string
    luggage?: string
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
  const [originLocation, destinationLocation, vehicleType, addonsData, extraItemPrices] = await Promise.all([
    getLocationDetails(fromId),
    getLocationDetails(toId),
    getVehicleType(vehicleTypeRef.id, fromId, toId),
    getActiveAddons(),
    getExtraItemPrices(),
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
  const pickupDate = sp.date || new Date().toISOString().split('T')[0]
  const pickupTime = sp.time || '10:00'
  // Clamp to what the vehicle can actually carry. Search filters by capacity, so this normally only
  // fires for stale or hand-crafted links; the stepper renders "Max N", so the reduced count is
  // visible rather than hidden. The `|| 1` also absorbs NaN from e.g. `?passengers=abc`.
  const passengers = Math.min(
    Math.max(1, parseInt(sp.passengers || '1') || 1),
    vehicleType.passenger_capacity
  )
  const luggage = parseInt(sp.luggage || '0') || 0

  return (
    <PublicLayout>
      <div className="bg-[var(--black-void)] min-h-screen">
        <div className="luxury-container py-8 md:py-16 lg:py-20">
          <ProgressBar currentStep={3} />
          <CheckoutHeading />
          <CheckoutWrapper
            route={routeDetails}
            vehicleType={vehicleType}
            initialDate={pickupDate}
            initialTime={pickupTime}
            initialPassengers={passengers}
            initialLuggage={luggage}
            user={user}
            profile={profile}
            addonsByCategory={addonsData.addonsByCategory}
            extraItemPrices={extraItemPrices}
          />
        </div>
      </div>
    </PublicLayout>
  )
}
