import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CheckoutWrapper } from '@/components/checkout/checkout-wrapper'
import { ProgressBar } from '@/components/checkout/progress-bar'
import { PublicLayout } from '@/components/layout/public-layout'
import { getRouteById, getVehicleType, getLocationDetails } from './actions'
import { createClient } from '@/lib/supabase/server'

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
  
  // Validate required parameters
  if (!params.from || !params.to || !params.vehicleType) {
    redirect('/')
  }

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

  // Fetch location and vehicle type details
  const [originLocation, destinationLocation, vehicleType] = await Promise.all([
    getLocationDetails(params.from!),
    getLocationDetails(params.to!),
    getVehicleType(params.vehicleType, params.from!, params.to!)
  ])

  if (!originLocation || !destinationLocation || !vehicleType) {
    redirect('/')
  }
  
  // Create route details from location data
  const routeDetails = {
    id: `${params.from}-${params.to}`,
    route_name: `${originLocation.name} to ${destinationLocation.name}`,
    distance_km: 0, // Would be calculated based on actual distance
    estimated_duration_minutes: 30, // Would be calculated based on actual duration
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
      <div className="bg-background min-h-screen">
        {/* Progress Bar */}
        <ProgressBar currentStep={3} />

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Complete Your Booking</h1>
          
          <CheckoutWrapper
            route={routeDetails}
            vehicleType={vehicleType}
            initialDate={pickupDate}
            initialTime={pickupTime}
            initialPassengers={passengers}
            initialLuggage={luggage}
            user={user}
            profile={profile}
          />
        </div>
      </div>
    </PublicLayout>
  )
}