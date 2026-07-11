import { Metadata } from 'next'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { PaymentWrapper } from './components/payment-wrapper'
import { ProgressBar } from '@/components/checkout/progress-bar'
import { SecureFooter } from './components/secure-footer'
import { GuaranteeCard } from './components/guarantee-card'
import { PublicHeader } from '@/components/layout/public-header'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HelpCircle } from 'lucide-react'
import { BookingSummaryPrices } from './components/booking-summary-prices'
import { format } from 'date-fns'
import { toBookingTz } from '@/lib/utils/timezone'
import {
  getEnabledCurrencies,
  getFeaturedCurrencies,
  getExchangeRatesObject,
  getDefaultCurrency,
  formatPrice,
} from '@/lib/currency'
import { CURRENCY_COOKIE_NAME } from '@/lib/currency/types'
import { CurrencyProvider } from '@/lib/currency/context'
import { verifyBookingSignature } from '@/lib/security/booking-hmac'

export const metadata: Metadata = {
  title: 'Secure Payment | Infinia Transfers',
  description: 'Complete your luxury transfer booking with our secure payment system',
}

interface PaymentPageProps {
  searchParams: Promise<{
    booking?: string
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

  // Verify HMAC signature before creating payment intent
  const { data: bookingForSig } = await adminClient
    .from('bookings')
    .select('total_price, customer_id, vehicle_type_id, price_signature, price_signature_timestamp, price_signature_nonce')
    .eq('id', bookingId)
    .eq('customer_id', userId)
    .single()

  if (bookingForSig?.price_signature && bookingForSig.price_signature_timestamp && bookingForSig.price_signature_nonce) {
    const hmacResult = verifyBookingSignature({
      bookingId,
      totalPrice: bookingForSig.total_price,
      customerId: bookingForSig.customer_id!,
      vehicleTypeId: bookingForSig.vehicle_type_id,
      signature: bookingForSig.price_signature,
      timestamp: Number(bookingForSig.price_signature_timestamp),
      nonce: bookingForSig.price_signature_nonce,
    })

    if (!hmacResult.valid) {
      console.error('SECURITY ALERT: HMAC verification failed in payment page', { bookingId, reason: hmacResult.reason })
      throw new Error('Booking integrity verification failed')
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
  const cookieStore = await cookies()

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

  // Fetch user profile for header
  let profile = null
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  profile = profileData

  // Fetch currency data
  const [featuredCurrencies, allCurrencies, rates, defaultCurrency] = await Promise.all([
    getFeaturedCurrencies(),
    getEnabledCurrencies(),
    getExchangeRatesObject(),
    getDefaultCurrency(),
  ])

  // Get user's currency preference from cookie
  const currencyCookie = cookieStore.get(CURRENCY_COOKIE_NAME)
  const currentCurrency = currencyCookie?.value || defaultCurrency
  // Helper function to format price in user's currency (used in error state)
  const formatUserPrice = (amount: number) => formatPrice(amount, currentCurrency, rates)

  // Get booking details
  const booking = await getBookingDetails(params.booking, user.id)

  if (!booking) {
    notFound()
  }

  // Check if already paid
  if (booking.payment_status === 'completed') {
    redirect(`/booking/confirmation/${booking.booking_number}`)
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
      <CurrencyProvider
        initialCurrency={currentCurrency}
        exchangeRates={rates}
        featuredCurrencies={featuredCurrencies}
        allCurrencies={allCurrencies}
      >
      <div className="min-h-screen bg-[var(--black-void)]">
        <PublicHeader initialUser={user} initialProfile={profile} />

        <div className="pt-24 md:pt-28 pb-16">
          <div className="luxury-container">
            <div className="mx-auto max-w-2xl">
              <div className="editorial-eyebrow">Payment unavailable</div>
              <h2 className="editorial-section-title mt-5">
                Can&rsquo;t reach the payment processor.
              </h2>
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
                {stripeError || 'Payment processing is currently unavailable. Your booking is held; complete payment from the link below or try again shortly.'}
              </p>

              <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-3 border-t border-[var(--graphite)] pt-6 sm:grid-cols-3 text-[0.875rem]">
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Booking</dt>
                  <dd className="numeric mt-1 text-[var(--gold-text)]">{booking.trip_number || booking.booking_number}</dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Amount</dt>
                  <dd className="numeric mt-1 text-[var(--text-primary)]">{formatUserPrice(booking.total_price)}</dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Status</dt>
                  <dd className="mt-1 text-[var(--text-primary)]">Pending</dd>
                </div>
              </dl>

              <Link href="/contact" className="btn btn-primary mt-10 inline-flex">
                Contact support
              </Link>
            </div>
          </div>
        </div>

        <SecureFooter />
      </div>
      </CurrencyProvider>
    )
  }

  return (
    <CurrencyProvider
      initialCurrency={currentCurrency}
      exchangeRates={rates}
      featuredCurrencies={featuredCurrencies}
      allCurrencies={allCurrencies}
    >
    <div className="flex min-h-screen flex-col bg-[var(--black-void)]">
      <PublicHeader
        initialUser={user}
        initialProfile={profile}
        featuredCurrencies={featuredCurrencies}
        allCurrencies={allCurrencies}
        currentCurrency={currentCurrency}
      />

      <main className="flex-1 pb-16 pt-20 md:pt-24">
        <div className="luxury-container py-10 md:py-14">
          <header className="mb-10 max-w-2xl">
            <ProgressBar currentStep={4} />
            <h1 className="editorial-headline text-[clamp(2rem,4vw,3rem)]">
              Confirm and pay.
            </h1>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
              We hold the vehicle for the next 15 minutes while you complete payment. Card details are processed by Stripe; we never see them.
            </p>
          </header>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
            <div>
              <PaymentWrapper
                clientSecret={clientSecret}
                bookingId={booking.id}
                amount={booking.total_price}
                bookingNumber={booking.booking_number}
              />
            </div>

            <aside aria-label="Booking summary" className="lg:sticky lg:top-24 border border-[var(--graphite)] bg-[var(--black-rich)]">
              <header className="border-b border-[var(--graphite)] px-6 py-5">
                <div className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Booking
                </div>
                <div className="numeric mt-1 text-[var(--gold-text)]">{booking.trip_number || booking.booking_number}</div>
                {booking.vehicle_type && (
                  <h3 className="mt-3 font-display text-xl text-[var(--text-primary)]">
                    {booking.vehicle_type.name}
                  </h3>
                )}
              </header>

              <dl className="grid grid-cols-1 gap-4 border-b border-[var(--graphite)] px-6 py-5 text-[0.875rem]">
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Pick-up</dt>
                  <dd className="mt-1 text-[var(--text-primary)]">{booking.pickup_address}</dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Drop-off</dt>
                  <dd className="mt-1 text-[var(--text-primary)]">{booking.dropoff_address}</dd>
                </div>
              </dl>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-[var(--graphite)] px-6 py-5 text-[0.875rem]">
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Date</dt>
                  <dd className="numeric mt-1 text-[var(--text-primary)]">
                    {format(toBookingTz(booking.pickup_datetime), 'EEE · d MMM')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Time</dt>
                  <dd className="numeric mt-1 text-[var(--text-primary)]">
                    {format(toBookingTz(booking.pickup_datetime), 'HH:mm')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Pax</dt>
                  <dd className="numeric mt-1 text-[var(--text-primary)]">{booking.passenger_count}</dd>
                </div>
                {booking.luggage_count && booking.luggage_count > 0 && (
                  <div>
                    <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Bags</dt>
                    <dd className="numeric mt-1 text-[var(--text-primary)]">{booking.luggage_count}</dd>
                  </div>
                )}
              </dl>

              <div className="px-6 py-5">
                <BookingSummaryPrices
                  basePrice={booking.base_price}
                  amenitiesPrice={booking.amenities_price ?? 0}
                  totalPrice={booking.total_price}
                />
              </div>

              <footer className="border-t border-[var(--graphite)] px-6 py-5">
                <GuaranteeCard />
                <Link
                  href="/contact"
                  className="mt-5 flex items-center justify-center gap-2 text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)] hover:text-[var(--gold-text-hover)] transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  Need help?
                </Link>
              </footer>
            </aside>
          </div>
        </div>
      </main>

      <SecureFooter />
    </div>
    </CurrencyProvider>
  )
}
