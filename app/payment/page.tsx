import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { PaymentWrapper } from './components/payment-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PublicLayout } from '@/components/layout/public-layout'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Clock, MapPin, Users, Luggage } from 'lucide-react'
import { format } from 'date-fns'

export const metadata: Metadata = {
  title: 'Payment | Complete Your Booking',
  description: 'Secure payment for your transfer booking',
}

interface PaymentPageProps {
  searchParams: Promise<{
    booking?: string
    amount?: string
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
        luggage_capacity
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

async function getOrCreatePaymentIntent(
  bookingId: string, 
  amount: number, 
  userId: string,
  userEmail: string,
  userName?: string,
  userPhone?: string
) {
  // Import Stripe functions
  const { createPaymentIntent, createOrRetrieveStripeCustomer } = await import('@/lib/stripe/server')
  const adminClient = createAdminClient()
  
  // Check if booking already has payment intent
  const { data: booking } = await adminClient
    .from('bookings')
    .select('stripe_payment_intent_id')
    .eq('id', bookingId)
    .eq('customer_id', userId)
    .single()
  
  if (booking?.stripe_payment_intent_id) {
    // Retrieve existing payment intent client secret
    try {
      const { retrievePaymentIntent } = await import('@/lib/stripe/server')
      const existingIntent = await retrievePaymentIntent(booking.stripe_payment_intent_id)
      return {
        clientSecret: existingIntent.client_secret
      }
    } catch (error) {
      console.log('Could not retrieve existing payment intent, creating new one')
    }
  }
  
  // Create or retrieve Stripe customer
  const stripeCustomerId = await createOrRetrieveStripeCustomer(
    userId,
    userEmail,
    userName,
    userPhone
  )
  
  // Create new payment intent with customer
  const paymentIntent = await createPaymentIntent(
    amount, 
    bookingId,
    stripeCustomerId,
    userEmail
  )
  
  // Update booking with payment intent ID
  await adminClient
    .from('bookings')
    .update({
      stripe_payment_intent_id: paymentIntent.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
  
  return {
    clientSecret: paymentIntent.client_secret
  }
}

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const params = await searchParams
  
  // Validate required parameters
  if (!params.booking) {
    redirect('/')
  }

  // Check authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    const returnUrl = `/payment?${new URLSearchParams(params as any).toString()}`
    redirect(`/auth/checkout-login?returnUrl=${encodeURIComponent(returnUrl)}`)
  }

  // Get booking details
  const booking = await getBookingDetails(params.booking, user.id)
  
  if (!booking) {
    notFound()
  }

  // Check if already paid
  if (booking.payment_status === 'completed') {
    redirect(`/booking/confirmation?booking=${booking.booking_number}`)
  }

  // Get primary passenger
  const primaryPassenger = booking.booking_passengers?.find((p: any) => p.is_primary)

  // Get user's full name for Stripe customer
  const userName = primaryPassenger 
    ? `${primaryPassenger.first_name} ${primaryPassenger.last_name}`
    : user.user_metadata?.full_name || ''
  
  const userPhone = primaryPassenger?.phone || ''

  // Create or retrieve payment intent
  let clientSecret: string | null = null
  let stripeError: string | null = null
  
  try {
    const result = await getOrCreatePaymentIntent(
      booking.id, 
      booking.total_price, 
      user.id,
      user.email || '',
      userName,
      userPhone
    )
    clientSecret = result.clientSecret
  } catch (error) {
    console.error('Payment intent creation failed:', error)
    stripeError = error instanceof Error ? error.message : 'Failed to initialize payment'
  }

  // If Stripe is not configured, show error message
  if (stripeError || !clientSecret) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Payment System Not Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {stripeError || 'Payment processing is currently unavailable.'}
                </p>
                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    For Testing/Development:
                  </p>
                  <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-decimal list-inside">
                    <li>Sign up for a Stripe account at stripe.com</li>
                    <li>Get your test API keys from the Stripe Dashboard</li>
                    <li>Add to your .env.local file:</li>
                  </ol>
                  <pre className="mt-2 p-2 bg-amber-100 dark:bg-amber-900 rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...`}
                  </pre>
                </div>
                <div className="pt-4">
                  <p className="font-semibold mb-2">Your Booking Details:</p>
                  <p className="text-sm text-muted-foreground">Booking Number: {booking.booking_number}</p>
                  <p className="text-sm text-muted-foreground">Amount: {formatCurrency(booking.total_price)}</p>
                  <p className="text-sm text-muted-foreground">Status: Payment Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Complete Your Payment</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <PaymentWrapper
              clientSecret={clientSecret}
              bookingId={booking.id}
              amount={booking.total_price}
              bookingNumber={booking.booking_number}
            />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Booking Number */}
                <div>
                  <p className="text-sm text-muted-foreground">Booking Reference</p>
                  <p className="font-mono font-semibold">{booking.booking_number}</p>
                </div>

                <Separator />

                {/* Route Details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">From</p>
                      <p className="text-sm text-muted-foreground">{booking.pickup_address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">To</p>
                      <p className="text-sm text-muted-foreground">{booking.dropoff_address}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Date & Time */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {format(new Date(booking.pickup_datetime), 'MMM dd, yyyy')}
                  </p>
                  <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                  <p className="text-sm">
                    {format(new Date(booking.pickup_datetime), 'HH:mm')}
                  </p>
                </div>

                {/* Passengers & Vehicle */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{booking.passenger_count} passengers</p>
                  </div>
                  {booking.luggage_count > 0 && (
                    <div className="flex items-center gap-2">
                      <Luggage className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{booking.luggage_count} luggage</p>
                    </div>
                  )}
                </div>

                {booking.vehicle_type && (
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle Type</p>
                    <p className="font-medium">{booking.vehicle_type.name}</p>
                  </div>
                )}

                <Separator />

                {/* Passenger Info */}
                {primaryPassenger && (
                  <div>
                    <p className="text-sm text-muted-foreground">Primary Passenger</p>
                    <p className="font-medium">
                      {primaryPassenger.first_name} {primaryPassenger.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{primaryPassenger.email}</p>
                  </div>
                )}

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Base Price</span>
                    <span>{formatCurrency(booking.base_price)}</span>
                  </div>
                  {booking.amenities_price > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Additional Services</span>
                      <span>{formatCurrency(booking.amenities_price)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount</span>
                    <span className="text-lg">{formatCurrency(booking.total_price)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}