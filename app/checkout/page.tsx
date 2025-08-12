import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BookingForm } from '@/components/checkout/booking-form'
import { OrderSummary } from '@/components/checkout/order-summary'
import { ProgressBar } from '@/components/checkout/progress-bar'
import { PublicLayout } from '@/components/layout/public-layout'
import { getRouteById, getVehicleType } from './actions'
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
  }>
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams
  
  // Validate required parameters
  if (!params.route || !params.vehicleType) {
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

  // Fetch route and vehicle type details
  const [routeDetails, vehicleType] = await Promise.all([
    getRouteById(params.route),
    getVehicleType(params.vehicleType)
  ])

  if (!routeDetails || !vehicleType) {
    redirect('/')
  }

  // Parse date and time
  const pickupDate = params.date || new Date().toISOString().split('T')[0]
  const pickupTime = params.time || '10:00'
  const passengers = parseInt(params.passengers || '1')

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen">
        {/* Progress Bar */}
        <ProgressBar currentStep={3} />

        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Complete Your Booking</h1>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Booking Form - 2 columns on desktop */}
            <div className="lg:col-span-2">
              <BookingForm
                route={routeDetails}
                vehicleType={vehicleType}
                initialDate={pickupDate}
                initialTime={pickupTime}
                initialPassengers={passengers}
                user={user}
                profile={profile}
              />
            </div>

            {/* Order Summary - 1 column on desktop, sticky */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <OrderSummary
                  route={routeDetails}
                  vehicleType={vehicleType}
                  passengers={passengers}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}