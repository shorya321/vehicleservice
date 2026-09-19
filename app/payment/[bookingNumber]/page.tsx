import { Metadata } from 'next'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { PaymentWrapper } from '../components/payment-wrapper'
import { ProgressBar } from '@/components/checkout/progress-bar'
import { CheckoutHeading } from '@/components/checkout/checkout-heading'
import { BookingLedger } from '@/components/checkout/booking-ledger'
import { SecureFooter } from '../components/secure-footer'
import { PublicHeader } from '@/components/layout/public-header'
import { Footer } from '@/components/layout/footer'
import { getSiteSettings } from '@/lib/site-settings/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HelpCircle } from 'lucide-react'
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
import { buildConfirmationUrl } from '@/lib/utils/url-builder'

export const metadata: Metadata = {
  // The root layout's title template appends ' | Infinia Transfers'.
  title: 'Confirm and pay',
  description: 'Confirm your transfer and pay securely. Free to cancel up to 24 hours before pickup.',
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
  const [featuredCurrencies, allCurrencies, rates, defaultCurrency, siteSettings] = await Promise.all([
    getFeaturedCurrencies(),
    getEnabledCurrencies(),
    getExchangeRatesObject(),
    getDefaultCurrency(),
    getSiteSettings(),
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
                      <p>Trip #: <span className="font-mono text-[var(--gold-text)]">{booking.trip_number || booking.booking_number}</span></p>
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
        {/* The same rail every other step opens on: progress, then the eyebrow in its gold-dot
            capsule, then a sentence-case heading, left-aligned. This block used to be centred,
            Title Case, and eyebrow-less, so the last screen before payment read as a different
            product. CheckoutHeading already took all three as props. */}
        <header className="pt-20 md:pt-24 pb-8 md:pb-10 product-entrance">
          {/* The rail starts where the checkout steps start theirs. This block used to add a
              second top padding on top of the header's own, which put the rail 35px below the
              line the previous two steps open on. */}
          <div className="luxury-container pt-4 md:pt-6 lg:pt-8">
            <ProgressBar currentStep={4} />
            {/* No eyebrow, matching the checkout steps: the rail directly above already names
                the step, and "Secure checkout" over a step called Payment is one sentence twice. */}
            {/* `mt-8`, the gap CheckoutStepHeader puts between the rail and the heading on both
                checkout steps. Without it the rail sat 30px above the h1 here against 62px
                there, so the last step read as a tighter page than the two before it. */}
            <div className="mt-8">
              <CheckoutHeading
                eyebrow={null}
                title="Confirm and pay"
                subtitle="Your card is charged once. Free to cancel up to 24 hours before pickup."
              />
            </div>
            {/* The reference used to appear for the first time as a mono chip in the middle of
                the payment card. It belongs with the heading, quietly. The `-mt-8` it used to
                carry was tuned against an older heading block and now pulled this line on top
                of the subtitle. */}
            <p className="mt-4 text-[0.8125rem] tabular-nums text-[var(--text-muted)]">
              Booking {booking.trip_number || booking.booking_number}
            </p>
          </div>
        </header>
        <main className="flex-1 pb-16">
          <div className="luxury-container">
            {/* `lg:items-start`, not `items-start`: in the column direction that property is the
                horizontal one, so it shrank the form column to the Stripe iframe's own content
                width and left it 34px narrower than the summary card above it. It is only wanted
                once the layout is a row, where it stops the sticky aside stretching. */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 lg:items-start">
              <div className="flex-1 min-w-0">
                <PaymentWrapper
                  clientSecret={clientSecret}
                  bookingId={booking.id}
                  amount={booking.total_price}
                  bookingNumber={booking.booking_number}
                  tripNumber={booking.trip_number || booking.booking_number}
                />
              </div>
              {/* `order-first` below lg: the summary used to sit after the card form in DOM
                  order, so on a phone the customer scrolled the whole of Stripe before seeing
                  what they were paying for. */}
              {/* `max-w-[520px]` while the columns are stacked: at 834px the card stretched to
                  738px, which pulled the route's two place names to opposite ends of a 400px
                  dashed line and left every ledger row half empty. It is the same card as on
                  checkout, so it keeps roughly the same measure until it becomes the rail. */}
              <aside className="order-first lg:order-last w-full max-w-[520px] lg:max-w-none lg:w-[380px] xl:w-[420px] flex-shrink-0 lg:sticky lg:top-24 product-entrance--sidebar" aria-label="Booking summary">
                <div className="checkout-summary-card">
                  {/* The cap the same card opens on at checkout, so the customer arrives at a
                      card they have already been reading for two steps. */}
                  <div className="checkout-stub-cap">
                    <h2 className="checkout-section-title editorial-eyebrow--pill"><i aria-hidden="true" />Your transfer</h2>
                  </div>
                  {/* The same card the customer has had beside them since step three, drawing
                      the same data the same way. This aside used to use bullet dots and icon
                      chips for the route, and printed `Base fare 110.00 / Total 110.00` when
                      there were no extras, which OrderSummary correctly suppressed. */}
                  <BookingLedger
                    category={null}
                    vehicleName={booking.vehicle_type?.name ?? 'Your transfer'}
                    originName={booking.pickup_address}
                    destinationName={booking.dropoff_address}
                    dateLabel={format(toBookingTz(booking.pickup_datetime), 'EEE, MMM d')}
                    timeLabel={format(toBookingTz(booking.pickup_datetime), 'HH:mm')}
                    passengers={booking.passenger_count}
                    luggage={booking.vehicle_type?.luggage_capacity ?? null}
                    seats={booking.vehicle_type?.passenger_capacity ?? null}
                    pickupNote={`Pickup ${format(toBookingTz(booking.pickup_datetime), 'HH:mm')}`}
                    basePrice={booking.base_price}
                    // One rolled-up line rather than a row per amenity: `booking_amenities`
                    // stores `amenity_type: 'addon'` and the addon name lives behind `addon_id`,
                    // so itemising here would need a join this query does not make. Same line
                    // BookingSummaryPrices showed.
                    addons={
                      (booking.amenities_price ?? 0) > 0
                        ? [{
                            id: 'amenities',
                            name: 'Additional services',
                            quantity: 1,
                            total_price: booking.amenities_price ?? 0,
                          }]
                        : []
                    }
                    total={booking.total_price}
                  />
                  <div className="px-6 xl:px-8 py-5 border-t border-[var(--stub-line)]">
                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] text-[0.8125rem] text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--stub-bot)] rounded-[4px]"
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
        <Footer siteSettings={siteSettings} />
      </div>
    </CurrencyProvider>
  )
}
