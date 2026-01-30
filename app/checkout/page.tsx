import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CheckoutWrapper } from '@/components/checkout/checkout-wrapper'
import { CheckoutHeading } from '@/components/checkout/checkout-heading'
import { ProgressBar } from '@/components/checkout/progress-bar'
import { PublicLayout } from '@/components/layout/public-layout'
import { getRouteById, getVehicleType, getLocationDetails, getActiveAddons } from './actions'
import { createClient } from '@/lib/supabase/server'
import { AmbientBackground } from '@/components/checkout/ambient-background'
import { getExchangeRatesObject, getDefaultCurrency } from '@/lib/currency/server'
import { CURRENCY_COOKIE_NAME } from '@/lib/currency/types'

export const metadata: Metadata = {
  title: 'Checkout | Complete Your Booking',
  description: 'Complete your transfer booking with secure payment',
}

interface CheckoutPageProps {
  searchParams: Promise<{
    route?: string
    vehicleType?: string
    from?: string
    to?: string
    date?: string
    time?: string
    passengers?: string
    luggage?: string
  }>
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams
  const cookieStore = await cookies()

  // Validate required parameters
  if (!params.from || !params.to || !params.vehicleType) {
    redirect('/')
  }

  // Fetch currency data
  const [rates, defaultCurrency] = await Promise.all([
    getExchangeRatesObject(),
    getDefaultCurrency(),
  ])

  // Get user's currency preference from cookie
  const currencyCookie = cookieStore.get(CURRENCY_COOKIE_NAME)
  const currentCurrency = currencyCookie?.value || defaultCurrency

  // Check authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If not authenticated, redirect to login with return URL
  if (!user) {
    const returnUrl = `/checkout?${new URLSearchParams(params as any).toString()}`
    const encodedReturnUrl = encodeURIComponent(returnUrl)
    redirect(`/auth/checkout-login?returnUrl=${encodedReturnUrl}`)
  }

  // Get user profile with retry logic for new registrations
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Check user role - only customers can make bookings
  if (profile && profile.role !== 'customer') {
    // Redirect based on role with appropriate message
    if (profile.role === 'admin') {
      redirect('/admin/dashboard?error=Admin users cannot make bookings')
    } else if (profile.role === 'vendor') {
      redirect('/vendor/dashboard?error=Vendor users cannot make bookings')
    } else if (profile.role === 'business') {
      redirect('/business/dashboard?error=Business users cannot make bookings')
    } else if (profile.role === 'driver') {
      redirect('/login?error=Driver users cannot make bookings')
    }
  }

  // If profile doesn't exist or is incomplete, try to get data from user metadata
  if (!profile || (!profile.first_name && !profile.last_name && !profile.phone)) {
    const userData = user.user_metadata
    
    // If we have metadata, use it to populate the profile
    if (userData && (userData.first_name || userData.last_name || userData.phone)) {
      profile = {
        ...profile,
        id: user.id,
        email: user.email || profile?.email,
        first_name: userData.first_name || profile?.first_name || '',
        last_name: userData.last_name || profile?.last_name || '',
        phone: userData.phone || profile?.phone || '',
        full_name: profile?.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
      }
      
      // Try to update the profile with the metadata
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          phone: userData.phone || '',
          full_name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          role: profile?.role || 'customer'
        })
    }
  }

  // Fetch location, vehicle type, and addons details
  const [originLocation, destinationLocation, vehicleType, addonsData] = await Promise.all([
    getLocationDetails(params.from!),
    getLocationDetails(params.to!),
    getVehicleType(params.vehicleType, params.from!, params.to!),
    getActiveAddons()
  ])

  if (!originLocation || !destinationLocation || !vehicleType) {
    redirect('/')
  }
  
  // Calculate distance if coordinates are available
  let calculatedDistance = 0
  if (originLocation.latitude && originLocation.longitude && 
      destinationLocation.latitude && destinationLocation.longitude) {
    // Use the database function to calculate distance
    const supabase = await createClient()
    const { data: distanceData } = await supabase
      .rpc('calculate_distance_km', {
        lat1: originLocation.latitude,
        lon1: originLocation.longitude,
        lat2: destinationLocation.latitude,
        lon2: destinationLocation.longitude
      })
    
    calculatedDistance = distanceData || 0
  }
  
  // Create route details from location data
  const routeDetails = {
    id: `${params.from}-${params.to}`,
    route_name: `${originLocation.name} to ${destinationLocation.name}`,
    distance_km: calculatedDistance,
    estimated_duration_minutes: 30, // Keep for backward compatibility, but we'll show distance instead
    base_price: vehicleType.price,
    origin: {
      id: originLocation.id,
      name: originLocation.name,
      city: originLocation.city || '',
      country_code: originLocation.country_code || 'US'
    },
    destination: {
      id: destinationLocation.id,
      name: destinationLocation.name,
      city: destinationLocation.city || '',
      country_code: destinationLocation.country_code || 'US'
    }
  }

  // Parse date and time
  const pickupDate = params.date || new Date().toISOString().split('T')[0]
  const pickupTime = params.time || '10:00'
  const passengers = parseInt(params.passengers || '1')
  const luggage = parseInt(params.luggage || '0')

  return (
    <PublicLayout>
      <div className="relative bg-luxury-black min-h-screen">
        {/* Progress Bar */}
        <ProgressBar currentStep={3} />

        {/* Ambient Background Animations */}
        <AmbientBackground />

        <div className="luxury-container py-12 md:py-16 lg:py-20 relative z-10">
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
            currentCurrency={currentCurrency}
            exchangeRates={rates}
          />
        </div>
      </div>
    </PublicLayout>
  )
}