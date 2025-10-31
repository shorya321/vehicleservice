import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { PaymentWrapper } from './components/payment-wrapper'
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
        <div className="bg-luxury-black min-h-screen py-12 md:py-16 lg:py-20">
          <div className="luxury-container max-w-4xl">
            <div className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-br from-luxury-gold/10 to-transparent p-6 border-b border-luxury-gold/20">
                <h2 className="font-serif text-2xl md:text-3xl text-luxury-pearl">Payment System Not Available</h2>
              </div>
              <div className="p-6 md:p-8 space-y-6">
                <p className="text-luxury-lightGray">
                  {stripeError || 'Payment processing is currently unavailable.'}
                </p>
                <div className="bg-amber-950/30 border border-amber-900/30 p-6 rounded-md">
                  <p className="text-sm font-semibold text-amber-100 mb-3">
                    For Testing/Development:
                  </p>
                  <ol className="text-sm text-amber-200/80 space-y-2 list-decimal list-inside">
                    <li>Sign up for a Stripe account at stripe.com</li>
                    <li>Get your test API keys from the Stripe Dashboard</li>
                    <li>Add to your .env.local file:</li>
                  </ol>
                  <pre className="mt-3 p-3 bg-amber-900/20 rounded text-xs overflow-x-auto text-amber-100">
{`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...`}
                  </pre>
                </div>
                <Separator className="border-luxury-gold/20" />
                <div>
                  <p className="font-serif text-lg text-luxury-pearl mb-3">Your Booking Details:</p>
                  <div className="space-y-1 text-sm text-luxury-lightGray">
                    <p>Booking Number: <span className="font-mono text-luxury-gold">{booking.booking_number}</span></p>
                    <p>Amount: <span className="text-luxury-pearl">{formatCurrency(booking.total_price)}</span></p>
                    <p>Status: <span className="text-amber-200">Payment Pending</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="bg-luxury-black min-h-screen py-12 md:py-16 lg:py-20">
        <div className="luxury-container max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-luxury-pearl mb-4">
              Complete Your Payment
            </h1>
            <div className="w-20 h-1 bg-luxury-gold rounded-full mx-auto" />
          </div>

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
              <div className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg overflow-hidden sticky top-24">
                <div className="bg-gradient-to-br from-luxury-gold/10 to-transparent p-6 border-b border-luxury-gold/20">
                  <h2 className="font-serif text-2xl md:text-3xl text-luxury-pearl">Booking Summary</h2>
                </div>
                <div className="p-6 space-y-4">
                  {/* Booking Number */}
                  <div>
                    <p className="text-xs text-luxury-lightGray uppercase tracking-wider mb-1">Booking Reference</p>
                    <p className="font-mono font-semibold text-luxury-pearl">{booking.booking_number}</p>
                  </div>

                  <Separator className="border-luxury-gold/20" />

                  {/* Route Details */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 mt-0.5" style={{ color: "#C6AA88" }} />
                      <div className="flex-1">
                        <p className="text-xs text-luxury-lightGray uppercase tracking-wider mb-1">From</p>
                        <p className="text-sm text-luxury-pearl">{booking.pickup_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 mt-0.5" style={{ color: "#C6AA88" }} />
                      <div className="flex-1">
                        <p className="text-xs text-luxury-lightGray uppercase tracking-wider mb-1">To</p>
                        <p className="text-sm text-luxury-pearl">{booking.dropoff_address}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="border-luxury-gold/20" />

                  {/* Date & Time */}
                  <div className="flex items-center gap-2 text-sm text-luxury-lightGray">
                    <Calendar className="h-4 w-4" style={{ color: "#C6AA88" }} />
                    <p>
                      {format(new Date(booking.pickup_datetime), 'MMM dd, yyyy')}
                    </p>
                    <Clock className="h-4 w-4 ml-2" style={{ color: "#C6AA88" }} />
                    <p>
                      {format(new Date(booking.pickup_datetime), 'HH:mm')}
                    </p>
                  </div>

                  {/* Passengers & Vehicle */}
                  <div className="flex items-center gap-4 text-sm text-luxury-lightGray">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" style={{ color: "#C6AA88" }} />
                      <p>{booking.passenger_count} passengers</p>
                    </div>
                    {booking.luggage_count > 0 && (
                      <div className="flex items-center gap-2">
                        <Luggage className="h-4 w-4" style={{ color: "#C6AA88" }} />
                        <p>{booking.luggage_count} luggage</p>
                      </div>
                    )}
                  </div>

                  {booking.vehicle_type && (
                    <div>
                      <p className="text-xs text-luxury-lightGray uppercase tracking-wider mb-1">Vehicle Type</p>
                      <p className="font-medium text-luxury-pearl">{booking.vehicle_type.name}</p>
                    </div>
                  )}

                  <Separator className="border-luxury-gold/20" />

                  {/* Passenger Info */}
                  {primaryPassenger && (
                    <div>
                      <p className="text-xs text-luxury-lightGray uppercase tracking-wider mb-1">Primary Passenger</p>
                      <p className="font-medium text-luxury-pearl">
                        {primaryPassenger.first_name} {primaryPassenger.last_name}
                      </p>
                      <p className="text-sm text-luxury-lightGray mt-1">{primaryPassenger.email}</p>
                    </div>
                  )}

                  <Separator className="border-luxury-gold/20" />

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-luxury-lightGray">
                      <span>Base Price</span>
                      <span className="text-luxury-pearl">{formatCurrency(booking.base_price)}</span>
                    </div>
                    {booking.amenities_price > 0 && (
                      <div className="flex justify-between text-sm text-luxury-lightGray">
                        <span>Additional Services</span>
                        <span className="text-luxury-pearl">{formatCurrency(booking.amenities_price)}</span>
                      </div>
                    )}
                    <Separator className="border-luxury-gold/30" />
                    <div className="flex justify-between font-semibold text-xl pt-2">
                      <span className="text-luxury-pearl">Total Amount</span>
                      <span className="text-luxury-gold font-serif">{formatCurrency(booking.total_price)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}