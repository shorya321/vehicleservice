import { Metadata } from 'next'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { PaymentWrapper } from '../components/payment-wrapper'
import { ProgressBar } from '@/components/checkout/progress-bar'
import { SecureFooter } from '../components/secure-footer'
import { GuaranteeCard } from '../components/guarantee-card'
import { PublicHeader } from '@/components/layout/public-header'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Calendar, Clock, Users, Luggage, HelpCircle } from 'lucide-react'
import { BookingSummaryPrices } from '../components/booking-summary-prices'
import { format } from 'date-fns'
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
import { buildConfirmationUrl } from '@/lib/utils/url-builder'

export const metadata: Metadata = {
  title: 'Secure Payment | Infinia Transfers',
  description: 'Complete your luxury transfer booking with our secure payment system',
}

interface PaymentRoutePageProps {
  params: Promise<{ bookingNumber: string }>
}

async function getBookingByNumber(bookingNumber: string, userId: string) {
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
    .eq('booking_number', bookingNumber)
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
  const { createPaymentIntent, createOrRetrieveStripeCustomer } = await import('@/lib/stripe/server')
  const adminClient = createAdminClient()

  const { data: bookingRecord } = await adminClient
    .from('bookings')
    .select('stripe_payment_intent_id')
    .eq('id', bookingId)
    .eq('customer_id', userId)
    .single()

  if (bookingRecord?.stripe_payment_intent_id) {
    try {
      const { retrievePaymentIntent } = await import('@/lib/stripe/server')
      const existingIntent = await retrievePaymentIntent(bookingRecord.stripe_payment_intent_id)
      return { clientSecret: existingIntent.client_secret }
    } catch {
      // Fall through to create a new payment intent
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

  const stripeCustomerId = await createOrRetrieveStripeCustomer(userId, userEmail, userName, userPhone)
  const paymentIntent = await createPaymentIntent(amount, bookingId, stripeCustomerId, userEmail)

  await adminClient
    .from('bookings')
    .update({
      stripe_payment_intent_id: paymentIntent.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  return { clientSecret: paymentIntent.client_secret }
}

export default async function PaymentRoutePage({ params }: PaymentRoutePageProps) {
  const { bookingNumber } = await params
  const cookieStore = await cookies()

  if (!bookingNumber) {
    redirect('/')
  }

  // Check authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const returnUrl = `/payment/${bookingNumber}`
    redirect(`/auth/checkout-login?returnUrl=${encodeURIComponent(returnUrl)}`)
  }

  // Fetch user profile for header
  let profile = null
  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  profile = profileData

  // Fetch currency data
  const [featuredCurrencies, allCurrencies, rates, defaultCurrency] = await Promise.all([
    getFeaturedCurrencies(),
    getEnabledCurrencies(),
    getExchangeRatesObject(),
    getDefaultCurrency(),
  ])

  const currencyCookie = cookieStore.get(CURRENCY_COOKIE_NAME)
  const currentCurrency = currencyCookie?.value || defaultCurrency
  const formatUserPrice = (amount: number) => formatPrice(amount, currentCurrency, rates)

  // Get booking details by booking number
  const booking = await getBookingByNumber(bookingNumber, user.id)

  if (!booking) {
    notFound()
  }

  // Check if already paid
  if (booking.payment_status === 'completed') {
    redirect(buildConfirmationUrl(booking.booking_number))
  }

  const primaryPassenger = booking.booking_passengers?.find(
    (p: { first_name: string; last_name: string; email: string | null; phone: string | null; is_primary: boolean | null }) => p.is_primary
  )
  const userName = primaryPassenger
    ? `${primaryPassenger.first_name} ${primaryPassenger.last_name}`
    : user.user_metadata?.full_name || ''
  const userPhone = primaryPassenger?.phone || ''

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
            <div className="luxury-container max-w-3xl">
              <div className="bg-[var(--black-rich)] border border-[rgba(var(--gold-rgb),0.12)] rounded-[8px] overflow-hidden">
                <div className="px-6 xl:px-8 py-5 border-b border-[rgba(var(--gold-rgb),0.1)]">
                  <h2 className="text-[1.375rem] font-semibold text-[var(--text-primary)]">Payment System Not Available</h2>
                </div>
                <div className="p-6 md:p-8 space-y-6">
                  <p className="text-[var(--text-secondary)]">
                    {stripeError || 'Payment processing is currently unavailable.'}
                  </p>
                  <div className="bg-[rgba(var(--gold-rgb),0.06)] border border-[rgba(var(--gold-rgb),0.15)] p-6 rounded-[4px]">
                    <p className="text-sm font-semibold text-[var(--gold-text)] mb-3">For Testing/Development:</p>
                    <ol className="text-sm text-[var(--text-secondary)] space-y-2 list-decimal list-inside">
                      <li>Sign up for a Stripe account at stripe.com</li>
                      <li>Get your test API keys from the Stripe Dashboard</li>
                      <li>Add to your .env.local file:</li>
                    </ol>
                    <pre className="mt-3 p-3 bg-[rgba(var(--gold-rgb),0.06)] rounded-[4px] text-xs overflow-x-auto text-[var(--gold-text)]">
{`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...`}
                    </pre>
                  </div>
                  <div className="pt-4 border-t border-[rgba(var(--gold-rgb),0.1)]">
                    <p className="text-lg font-medium text-[var(--text-primary)] mb-3">Your Booking Details:</p>
                    <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                      <p>Booking Number: <span className="font-mono text-[var(--gold-text)]">{booking.booking_number}</span></p>
                      <p>Amount: <span className="text-[var(--text-primary)]">{formatUserPrice(booking.total_price)}</span></p>
                      <p>Status: <span className="text-[var(--gold-text)]">Payment Pending</span></p>
                    </div>
                  </div>
                </div>
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
      <div className="min-h-screen bg-[var(--black-void)] flex flex-col">
        <PublicHeader
          initialUser={user}
          initialProfile={profile}
        />
        <header className="text-center pt-20 md:pt-24 pb-8 md:pb-10 product-entrance">
          <div className="luxury-container">
            <ProgressBar currentStep={4} />
            <h1 className="editorial-section-title mt-8">
              Secure Payment
            </h1>
            <p className="editorial-body mt-4 mx-auto max-w-[500px]">
              Complete your booking with our encrypted payment system
            </p>
          </div>
        </header>
        <main className="flex-1 pb-16">
          <div className="luxury-container">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
              <div className="flex-1 min-w-0">
                <PaymentWrapper
                  clientSecret={clientSecret}
                  bookingId={booking.id}
                  amount={booking.total_price}
                  bookingNumber={booking.booking_number}
                />
              </div>
              <aside className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 lg:sticky lg:top-24 product-entrance--sidebar" aria-label="Booking summary">
                <div className="bg-[var(--black-rich)] border border-[rgba(var(--gold-rgb),0.12)] rounded-[8px] overflow-hidden">
                  <div className="px-6 xl:px-8 py-5 border-b border-[rgba(var(--gold-rgb),0.1)]">
                    <h2 className="text-[1.375rem] font-semibold text-[var(--text-primary)]">Booking Summary</h2>
                  </div>
                  <div className="px-6 xl:px-8 py-6 space-y-5">
                    {booking.vehicle_type && (
                      <div className="pb-5 border-b border-[rgba(var(--gold-rgb),0.1)]">
                        <span className="t-label">
                          Luxury Transfer
                        </span>
                        <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)] mt-1">{booking.vehicle_type.name}</h3>
                      </div>
                    )}
                    <div className="space-y-3 pb-5 border-b border-[rgba(var(--gold-rgb),0.1)]">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-[var(--gold)] flex-shrink-0" />
                        <div>
                          <span className="t-label block leading-none">Pick-up</span>
                          <p className="text-[1rem] font-medium text-[var(--text-primary)] leading-tight mt-1 break-words">{booking.pickup_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-[var(--gold-deep)] flex-shrink-0" />
                        <div>
                          <span className="t-label block leading-none">Drop-off</span>
                          <p className="text-[1rem] font-medium text-[var(--text-primary)] leading-tight mt-1 break-words">{booking.dropoff_address}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 pb-5 border-b border-[rgba(var(--gold-rgb),0.1)]">
                      <span className="flex items-center gap-1.5 text-[0.8125rem] text-[var(--text-secondary)]">
                        <Calendar className="w-3.5 h-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                        {format(new Date(booking.pickup_datetime), 'MMM dd, yyyy')}
                      </span>
                      <span className="flex items-center gap-1.5 text-[0.8125rem] text-[var(--text-secondary)]">
                        <Clock className="w-3.5 h-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                        {format(new Date(booking.pickup_datetime), 'HH:mm')}
                      </span>
                      <span className="flex items-center gap-1.5 text-[0.8125rem] text-[var(--text-secondary)]">
                        <Users className="w-3.5 h-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                        {booking.passenger_count} passengers
                      </span>
                      {(booking.luggage_count ?? 0) > 0 && (
                        <span className="flex items-center gap-1.5 text-[0.8125rem] text-[var(--text-secondary)]">
                          <Luggage className="w-3.5 h-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                          {booking.luggage_count} luggage
                        </span>
                      )}
                    </div>
                    <BookingSummaryPrices
                      basePrice={booking.base_price}
                      amenitiesPrice={booking.amenities_price ?? 0}
                      totalPrice={booking.total_price}
                    />
                  </div>
                  <div className="px-6 xl:px-8 py-5 bg-[rgba(var(--graphite-rgb),0.3)] border-t border-[rgba(var(--gold-rgb),0.1)]">
                    <GuaranteeCard />
                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center gap-2 mt-5 min-h-[44px] text-[0.8125rem] text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)] rounded-[4px]"
                    >
                      <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      Need help with your booking?
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
        <SecureFooter />
      </div>
    </CurrencyProvider>
  )
}
