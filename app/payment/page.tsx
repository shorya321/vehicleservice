import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { PaymentWrapper } from './components/payment-wrapper'
import { ProgressBar } from '@/components/checkout/progress-bar'
import { SecureFooter } from './components/secure-footer'
import { GuaranteeCard } from './components/guarantee-card'
import { PublicHeader } from '@/components/layout/public-header'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils'
import { Calendar, Clock, Users, Luggage, HelpCircle } from 'lucide-react'
import { format } from 'date-fns'

export const metadata: Metadata = {
  title: 'Secure Payment | Infinia Transfers',
  description: 'Complete your luxury transfer booking with our secure payment system',
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
      <div className="min-h-screen bg-[#050506]">
        {/* Ambient Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(198,170,136,0.04)_0%,transparent_70%)] pointer-events-none" />

        {/* Header */}
        <PublicHeader />

        <div className="pt-24 md:pt-28 pb-16 px-6 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-[rgba(22,21,20,0.95)] to-[rgba(15,14,13,0.98)] border border-[rgba(198,170,136,0.15)] rounded-[20px] overflow-hidden">
              <div className="bg-gradient-to-r from-[rgba(198,170,136,0.1)] to-transparent px-6 py-5 border-b border-[rgba(198,170,136,0.1)]">
                <h2 className="font-serif text-2xl text-[#f8f6f3]">Payment System Not Available</h2>
              </div>
              <div className="p-6 md:p-8 space-y-6">
                <p className="text-[#b8b4ae]">
                  {stripeError || 'Payment processing is currently unavailable.'}
                </p>
                <div className="bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] p-6 rounded-xl">
                  <p className="text-sm font-semibold text-[#fbbf24] mb-3">
                    For Testing/Development:
                  </p>
                  <ol className="text-sm text-[#fbbf24]/80 space-y-2 list-decimal list-inside">
                    <li>Sign up for a Stripe account at stripe.com</li>
                    <li>Get your test API keys from the Stripe Dashboard</li>
                    <li>Add to your .env.local file:</li>
                  </ol>
                  <pre className="mt-3 p-3 bg-[rgba(251,191,36,0.1)] rounded text-xs overflow-x-auto text-[#fbbf24]">
{`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...`}
                  </pre>
                </div>
                <div className="pt-4 border-t border-[rgba(198,170,136,0.1)]">
                  <p className="font-serif text-lg text-[#f8f6f3] mb-3">Your Booking Details:</p>
                  <div className="space-y-1 text-sm text-[#b8b4ae]">
                    <p>Booking Number: <span className="font-mono text-[#c6aa88]">{booking.booking_number}</span></p>
                    <p>Amount: <span className="text-[#f8f6f3]">{formatCurrency(booking.total_price)}</span></p>
                    <p>Status: <span className="text-[#fbbf24]">Payment Pending</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SecureFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050506] flex flex-col">
      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noise)%22%2F%3E%3C%2Fsvg%3E')] opacity-[0.03] pointer-events-none z-[9999]" />

      {/* Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(198,170,136,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Header */}
      <PublicHeader />

      {/* Progress Section */}
      <div className="pt-20 md:pt-24">
        <ProgressBar currentStep={4} />
      </div>

      {/* Page Header */}
      <header className="text-center py-8 md:py-10 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-8">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] font-light mb-4 text-[#f8f6f3]">
            Secure{' '}
            <span className="bg-gradient-to-r from-[#e8d9c5] via-[#c6aa88] to-[#8b7349] bg-clip-text text-transparent">
              Payment
            </span>
          </h1>
          <p className="text-base text-[#b8b4ae] max-w-[500px] mx-auto">
            Complete your booking with our encrypted payment system
          </p>
          {/* Decorative Divider */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className="h-px w-12 bg-gradient-to-r from-transparent via-[#c6aa88] to-transparent" />
            <span className="w-2 h-2 border border-[#c6aa88] rotate-45" />
            <span className="h-px w-12 bg-gradient-to-r from-transparent via-[#c6aa88] to-transparent" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-start">
            {/* Payment Form */}
            <div>
              <PaymentWrapper
                clientSecret={clientSecret}
                bookingId={booking.id}
                amount={booking.total_price}
                bookingNumber={booking.booking_number}
              />
            </div>

            {/* Order Summary Sidebar */}
            <aside className="lg:sticky lg:top-24">
              <div className="bg-gradient-to-br from-[rgba(22,21,20,0.95)] to-[rgba(15,14,13,0.98)] border border-[rgba(198,170,136,0.15)] rounded-[20px] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(198,170,136,0.05)_inset]">
                {/* Summary Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-[rgba(198,170,136,0.1)] to-transparent border-b border-[rgba(198,170,136,0.1)]">
                  <h3 className="font-serif text-xl text-[#f8f6f3]">Booking Summary</h3>
                </div>

                <div className="p-6 space-y-5">
                  {/* Vehicle */}
                  {booking.vehicle_type && (
                    <div className="pb-5 border-b border-[rgba(198,170,136,0.1)]">
                      <span className="text-[0.5625rem] font-semibold tracking-[0.1em] uppercase text-[#c6aa88]">
                        Luxury Transfer
                      </span>
                      <h4 className="font-serif text-base text-[#f8f6f3]">{booking.vehicle_type.name}</h4>
                    </div>
                  )}

                  {/* Route */}
                  <div className="space-y-3 pb-5 border-b border-[rgba(198,170,136,0.1)]">
                    {/* Pickup */}
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-0 rounded-full bg-[#c6aa88] flex-shrink-0" />
                      <div>
                        <span className="text-[0.625rem] font-medium tracking-[0.1em] uppercase text-[#7a7672] block leading-none">Pick-up</span>
                        <p className="text-[0.9375rem] text-[#f8f6f3] leading-tight mt-1">{booking.pickup_address}</p>
                      </div>
                    </div>
                    {/* Dropoff */}
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-0 rounded-full bg-[#a68b5b] flex-shrink-0" />
                      <div>
                        <span className="text-[0.625rem] font-medium tracking-[0.1em] uppercase text-[#7a7672] block leading-none">Drop-off</span>
                        <p className="text-[0.9375rem] text-[#f8f6f3] leading-tight mt-1">{booking.dropoff_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-4 pb-5 border-b border-[rgba(198,170,136,0.1)]">
                    <span className="flex items-center gap-1.5 text-[0.8125rem] text-[#b8b4ae]">
                      <Calendar className="w-3.5 h-3.5 stroke-[#c6aa88]" />
                      {format(new Date(booking.pickup_datetime), 'MMM dd, yyyy')}
                    </span>
                    <span className="flex items-center gap-1.5 text-[0.8125rem] text-[#b8b4ae]">
                      <Clock className="w-3.5 h-3.5 stroke-[#c6aa88]" />
                      {format(new Date(booking.pickup_datetime), 'HH:mm')}
                    </span>
                    <span className="flex items-center gap-1.5 text-[0.8125rem] text-[#b8b4ae]">
                      <Users className="w-3.5 h-3.5 stroke-[#c6aa88]" />
                      {booking.passenger_count} passengers
                    </span>
                    {booking.luggage_count > 0 && (
                      <span className="flex items-center gap-1.5 text-[0.8125rem] text-[#b8b4ae]">
                        <Luggage className="w-3.5 h-3.5 stroke-[#c6aa88]" />
                        {booking.luggage_count} luggage
                      </span>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2 pb-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#b8b4ae]">Base Fare</span>
                      <span className="text-[#f8f6f3]">{formatCurrency(booking.base_price)}</span>
                    </div>
                    {booking.amenities_price > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#b8b4ae]">Additional Services</span>
                        <span className="text-[#f8f6f3]">{formatCurrency(booking.amenities_price)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-[#b8b4ae]">Meet & Greet</span>
                      <span className="text-[#f8f6f3]">Free</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center pt-5 border-t border-[rgba(198,170,136,0.15)]">
                    <span className="text-[0.9375rem] text-[#f8f6f3]">Total</span>
                    <span className="font-serif text-2xl font-medium bg-gradient-to-r from-[#e8d9c5] to-[#c6aa88] bg-clip-text text-transparent">
                      {formatCurrency(booking.total_price)}
                    </span>
                  </div>
                </div>

                {/* Summary Footer */}
                <div className="p-6 bg-[rgba(42,40,38,0.3)] border-t border-[rgba(198,170,136,0.1)]">
                  <GuaranteeCard />

                  {/* Help Link */}
                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-2 mt-5 text-[0.8125rem] text-[#c6aa88] hover:text-[#d4c4a8] transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Need help with your booking?
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Secure Footer */}
      <SecureFooter />
    </div>
  )
}
