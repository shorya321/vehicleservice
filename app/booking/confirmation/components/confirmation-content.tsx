'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { Copy, Check, Printer, Info, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(d)

const formatTime = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d)

interface BookingPassenger {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  is_primary: boolean | null
}

interface BookingAmenity {
  amenity_type: string
  quantity: number | null
  price: number
  addon_id: string | null
  addon: { id: string; name: string; icon: string | null } | null
}

interface VehicleType {
  id: string
  name: string
  passenger_capacity: number | null
  luggage_capacity: number | null
  description: string | null
  image_url: string | null
}

interface Booking {
  booking_number: string
  trip_number?: string | null
  booking_status: string
  pickup_address: string
  dropoff_address: string
  pickup_datetime: string | null
  passenger_count: number
  luggage_count: number | null
  base_price: number
  total_price: number
  customer_notes: string | null
  vehicle_type: VehicleType | null
  booking_passengers: BookingPassenger[]
  booking_amenities: BookingAmenity[]
}

interface ConfirmationContentProps {
  booking: Booking
  primaryPassenger: BookingPassenger | undefined
  childSeats: BookingAmenity[]
  extraLuggage: BookingAmenity | undefined
  addons: BookingAmenity[]
}

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1]


function SuccessCheck({ skip }: { skip: boolean }) {
  return (
    <div className="flex justify-center mb-6">
      <div className="relative w-16 h-16">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
          className="block"
        >
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            stroke="var(--gold)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            initial={skip ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={skip ? { duration: 0 } : { duration: 0.7, ease: EASE_LUXURY }}
          />
          <motion.path
            d="M21 33L28.5 40.5L43 26"
            stroke="var(--gold)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={skip ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={skip ? { duration: 0 } : { duration: 0.45, delay: 0.55, ease: EASE_LUXURY }}
          />
        </svg>
      </div>
    </div>
  )
}

function CancelledIcon({ skip }: { skip: boolean }) {
  return (
    <div className="flex justify-center mb-6">
      <div className="relative w-16 h-16">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
          className="block"
        >
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            initial={skip ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={skip ? { duration: 0 } : { duration: 0.7, ease: EASE_LUXURY }}
          />
          <motion.path
            d="M24 24L40 40M40 24L24 40"
            stroke="var(--text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            initial={skip ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={skip ? { duration: 0 } : { duration: 0.45, delay: 0.55, ease: EASE_LUXURY }}
          />
        </svg>
      </div>
    </div>
  )
}

function CompletedIcon({ skip }: { skip: boolean }) {
  return (
    <div className="flex justify-center mb-6">
      <div className="relative w-16 h-16">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
          className="block"
        >
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            stroke="var(--text-secondary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            initial={skip ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={skip ? { duration: 0 } : { duration: 0.7, ease: EASE_LUXURY }}
          />
          <motion.path
            d="M21 33L28.5 40.5L43 26"
            stroke="var(--text-secondary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={skip ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={skip ? { duration: 0 } : { duration: 0.45, delay: 0.55, ease: EASE_LUXURY }}
          />
        </svg>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[0.875rem] text-[var(--text-secondary)] min-w-0 truncate">{label}</dt>
      <dd className="numeric text-[0.875rem] font-medium text-[var(--text-primary)] shrink-0">{value}</dd>
    </div>
  )
}

function CardMotion({
  children,
  skip,
  delay,
  className,
  ...rest
}: {
  children: React.ReactNode
  skip: boolean
  delay: number
  className?: string
  id?: string
  'aria-labelledby'?: string
}) {
  return (
    <motion.section
      className={className}
      initial={skip ? false : { opacity: 0, y: 8 }}
      animate={skip ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE_LUXURY }}
      {...rest}
    >
      {children}
    </motion.section>
  )
}

function getStatusConfig(status: string) {
  if (status === 'cancelled') {
    return {
      eyebrow: 'Cancelled',
      headline: 'Transfer cancelled.',
      body: 'This booking has been cancelled. If you believe this is an error, please contact support.',
      showPricing: false,
      icon: 'cancelled' as const,
    }
  }
  if (status === 'completed') {
    return {
      eyebrow: 'Completed',
      headline: 'Transfer completed.',
      body: 'We hope you had a pleasant journey. Thank you for choosing Infinia Transfers.',
      showPricing: true,
      icon: 'completed' as const,
    }
  }
  if (status === 'pending') {
    return {
      eyebrow: 'Pending',
      headline: 'Booking pending.',
      body: 'Your booking is being processed. You will receive a confirmation once it is approved.',
      showPricing: true,
      icon: 'completed' as const,
    }
  }
  return {
    eyebrow: 'Confirmed',
    headline: (
      <>
        Your transfer is <em>booked.</em>
      </>
    ),
    body: null,
    showPricing: true,
    icon: 'success' as const,
  }
}

export function ConfirmationContent({
  booking,
  primaryPassenger,
  childSeats,
  extraLuggage,
  addons,
}: ConfirmationContentProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const reduceMotion = useReducedMotion()
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  const skip = !!reduceMotion
  const formatUserPrice = (amount: number) => formatPrice(amount ?? 0, currentCurrency, exchangeRates)
  const isConverted = currentCurrency !== 'AED'
  const pickupDate = booking.pickup_datetime ? new Date(booking.pickup_datetime) : null
  const statusConfig = getStatusConfig(booking.booking_status)
  const copyBookingNumber = async () => {
    try {
      await navigator.clipboard.writeText(booking.trip_number || booking.booking_number)
      setCopied(true)
      toast.success('Booking reference copied')
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const cardClass = 'bg-[var(--black-rich)] border border-[rgba(var(--gold-rgb),0.12)] rounded-[8px] overflow-hidden'
  const cardHeaderClass = 'px-6 xl:px-8 py-5 border-b border-[rgba(var(--gold-rgb),0.1)]'
  const cardBodyClass = 'px-6 xl:px-8 py-6'
  const dividerClass = 'border-[rgba(var(--gold-rgb),0.1)]'
  const actionBtnClass = 'inline-flex min-h-[44px] items-center gap-2 border border-[var(--graphite)] px-4 text-[0.75rem] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)] rounded-[4px]'

  const pricingSummary = (
    <>
      <dl className="space-y-2.5">
        <SummaryRow
          label={`Base fare · ${booking.passenger_count} passenger${booking.passenger_count > 1 ? 's' : ''}`}
          value={formatUserPrice(booking.base_price)}
        />
        {childSeats.map((seat, idx) => (
          <SummaryRow
            key={`seat-${idx}`}
            label={`${seat.amenity_type === 'child_seat_infant' ? 'Infant seat' : 'Booster seat'}${(seat.quantity ?? 1) > 1 ? ` × ${seat.quantity}` : ''}`}
            value={formatUserPrice(seat.price)}
          />
        ))}
        {extraLuggage && (
          <SummaryRow
            label={`Extra luggage × ${extraLuggage.quantity}`}
            value={formatUserPrice(extraLuggage.price)}
          />
        )}
        {addons.map((addon, idx) => (
          <SummaryRow
            key={`addon-${idx}`}
            label={`${addon.addon?.name || 'Add-on'}${(addon.quantity ?? 1) > 1 ? ` × ${addon.quantity}` : ''}`}
            value={formatUserPrice(addon.price)}
          />
        ))}
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-[0.875rem] text-[var(--text-secondary)]">Meet &amp; greet</dt>
          <dd className="text-[var(--text-muted)] uppercase tracking-[0.14em] text-[0.6875rem]">Included</dd>
        </div>
      </dl>

      <div className={`mt-6 flex items-baseline justify-between border-t pt-6 ${dividerClass}`}>
        <span className="t-label">Total paid</span>
        <span className="t-price">{formatUserPrice(booking.total_price)}</span>
      </div>

      {isConverted && (
        <p className="mt-3 flex items-start gap-2 text-[0.75rem] text-[var(--text-muted)]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Shown in {currentCurrency}. Charged in AED ({formatPrice(booking.total_price ?? 0, 'AED', exchangeRates)}).
          </span>
        </p>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-[var(--black-void)] py-12 md:py-20">
      <div className="luxury-container max-w-6xl">

        {/* Hero */}
        <motion.header
          className="text-center max-w-2xl mx-auto"
          initial={skip ? false : { opacity: 0, y: 16 }}
          animate={skip ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_LUXURY }}
        >
          {statusConfig.icon === 'cancelled' && <CancelledIcon skip={skip} />}
          {statusConfig.icon === 'completed' && <CompletedIcon skip={skip} />}
          {statusConfig.icon === 'success' && <SuccessCheck skip={skip} />}

          <div className="inline-flex items-center gap-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
            <span className="w-7 h-px bg-[var(--gold)]" aria-hidden="true" />
            {statusConfig.eyebrow}
            <span className="mx-1 text-[var(--graphite)]" aria-hidden="true">&middot;</span>
            <span className="numeric text-[var(--text-muted)]">
              No. {booking.trip_number || booking.booking_number}
            </span>
          </div>

          <h1 className="editorial-headline mt-5 text-[clamp(2.25rem,5vw,3.75rem)] [text-wrap:balance]">
            {statusConfig.headline}
          </h1>

          {statusConfig.body ? (
            <p className="mt-5 text-[1rem] leading-relaxed text-[var(--text-secondary)]">
              {statusConfig.body}
            </p>
          ) : (
            <p className="mt-5 text-[1rem] leading-relaxed text-[var(--text-secondary)]">
              A confirmation has been sent to{' '}
              <span className="text-[var(--text-primary)]">{primaryPassenger?.email || 'your email'}</span>.
              Your chauffeur will contact you 30 minutes before pickup.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
            <button
              onClick={copyBookingNumber}
              className={actionBtnClass}
              aria-label="Copy booking reference"
            >
              {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy reference'}
            </button>
<button
              onClick={() => window.print()}
              className={`print:hidden ${actionBtnClass}`}
              aria-label="Print confirmation"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              Print
            </button>
          </div>
        </motion.header>

        {/* Content zone: two-column */}
        <motion.div
          className="mt-12 md:mt-16 flex flex-col lg:flex-row gap-6 lg:gap-10 items-start"
          initial={skip ? false : { opacity: 0 }}
          animate={skip ? undefined : { opacity: 1 }}
          transition={{ duration: 0.3, delay: skip ? 0 : 0.1, ease: EASE_LUXURY }}
        >

          {/* Main column */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Itinerary card */}
            <CardMotion skip={skip} delay={skip ? 0 : 0.1} aria-labelledby="itinerary-heading" className={cardClass}>
              <div className={cardHeaderClass}>
                <h2 id="itinerary-heading" className="t-label">Itinerary</h2>
              </div>
              <div className={cardBodyClass}>
                <dl>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    <div>
                      <dt className="t-label">From</dt>
                      <dd className="mt-1.5 text-[1.125rem] font-medium leading-tight text-[var(--text-primary)] break-words">
                        {booking.pickup_address}
                      </dd>
                    </div>
                    <div>
                      <dt className="t-label">To</dt>
                      <dd className="mt-1.5 text-[1.125rem] font-medium leading-tight text-[var(--text-primary)] break-words">
                        {booking.dropoff_address}
                      </dd>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[rgba(var(--gold-rgb),0.06)]">
                    <div className="flex flex-wrap gap-x-8 gap-y-5">
                      <div>
                        <dt className="t-label">Date</dt>
                        <dd className="numeric mt-1.5 text-[1rem] font-medium leading-snug text-[var(--text-primary)]">
                          {pickupDate ? formatDate(pickupDate) : 'TBC'}
                        </dd>
                      </div>
                      <div>
                        <dt className="t-label">Pickup</dt>
                        <dd className="numeric mt-1.5 text-[1rem] font-medium leading-snug text-[var(--text-primary)]">
                          {pickupDate ? formatTime(pickupDate) : 'TBC'}
                        </dd>
                      </div>
                      {booking.vehicle_type && (
                        <div className="flex items-start gap-3">
                          {booking.vehicle_type.image_url && (
                            <Image
                              src={booking.vehicle_type.image_url}
                              alt={booking.vehicle_type.name}
                              width={80}
                              height={48}
                              className="mt-1.5 rounded object-contain w-12 h-8 lg:w-[72px] lg:h-12"
                            />
                          )}
                          <div>
                            <dt className="t-label">Vehicle</dt>
                            <dd className="mt-1.5 text-[1rem] font-medium leading-snug text-[var(--text-primary)]">
                              {booking.vehicle_type.name}
                            </dd>
                          </div>
                        </div>
                      )}
                      <div>
                        <dt className="t-label">Passengers</dt>
                        <dd className="numeric mt-1.5 text-[1rem] font-medium leading-snug text-[var(--text-primary)]">
                          {booking.passenger_count}{booking.vehicle_type ? ` / ${booking.vehicle_type.passenger_capacity}` : ''}
                        </dd>
                      </div>
                      <div>
                        <dt className="t-label">Bags</dt>
                        <dd className="numeric mt-1.5 text-[1rem] font-medium leading-snug text-[var(--text-primary)]">
                          {booking.luggage_count || 0}{booking.vehicle_type ? ` / ${booking.vehicle_type.luggage_capacity}` : ''}
                        </dd>
                      </div>
                    </div>
                  </div>
                </dl>
              </div>
            </CardMotion>

            {/* Passenger details card */}
            {primaryPassenger && (
              <CardMotion skip={skip} delay={skip ? 0 : 0.15} aria-labelledby="passenger-heading" className={cardClass}>
                <div className={cardHeaderClass}>
                  <h2 id="passenger-heading" className="t-label">Passenger Details</h2>
                </div>
                <div className={cardBodyClass}>
                  <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
                    <div>
                      <dt className="t-label">Name</dt>
                      <dd className="mt-1.5 font-medium text-[var(--text-primary)] truncate">
                        {primaryPassenger.first_name} {primaryPassenger.last_name}
                      </dd>
                    </div>
                    <div>
                      <dt className="t-label">Email</dt>
                      <dd className="mt-1.5 font-medium text-[var(--text-primary)] break-all">{primaryPassenger.email}</dd>
                    </div>
                    <div>
                      <dt className="t-label">Phone</dt>
                      <dd className="numeric mt-1.5 font-medium text-[var(--text-primary)] break-words">{primaryPassenger.phone}</dd>
                    </div>
                  </dl>
                </div>
              </CardMotion>
            )}

            {/* Customer notes card (conditional) */}
            {booking.customer_notes && (
              <CardMotion skip={skip} delay={skip ? 0 : 0.2} aria-labelledby="notes-heading" className={cardClass}>
                <div className={cardHeaderClass}>
                  <h2 id="notes-heading" className="t-label">Your Notes</h2>
                </div>
                <div className={cardBodyClass}>
                  <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
                    {booking.customer_notes}
                  </p>
                </div>
              </CardMotion>
            )}

            {/* Mobile pricing summary */}
            {statusConfig.showPricing && (
              <motion.div
                className="lg:hidden"
                role="region"
                initial={skip ? false : { opacity: 0, y: 8 }}
                animate={skip ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: skip ? 0 : 0.25, ease: EASE_LUXURY }}
                aria-label="Payment summary"
              >
                <div className={cardClass}>
                  <div className={cardHeaderClass}>
                    <h2 className="t-label">Payment Summary</h2>
                  </div>
                  <div className={cardBodyClass}>
                    {pricingSummary}
                  </div>
                </div>
              </motion.div>
            )}

            {/* What happens next card */}
            <CardMotion skip={skip} delay={skip ? 0 : 0.25} aria-labelledby="next-heading" className={cardClass}>
              <div className={cardHeaderClass}>
                <h2 id="next-heading" className="t-label">What Happens Next</h2>
              </div>
              <div className={cardBodyClass}>
                <ol className="space-y-4 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
                  <li className="flex gap-4">
                    <span aria-hidden="true" className="numeric shrink-0 text-[0.75rem] font-medium text-[var(--gold-text)] tracking-[0.14em]">01</span>
                    <span>Be ready at your pickup location 5 minutes before the scheduled time.</span>
                  </li>
                  <li className="flex gap-4">
                    <span aria-hidden="true" className="numeric shrink-0 text-[0.75rem] font-medium text-[var(--gold-text)] tracking-[0.14em]">02</span>
                    <span>Your chauffeur will wait up to 15 minutes past the scheduled pickup (60 minutes for airport meet-and-greet).</span>
                  </li>
                  <li className="flex gap-4">
                    <span aria-hidden="true" className="numeric shrink-0 text-[0.75rem] font-medium text-[var(--gold-text)] tracking-[0.14em]">03</span>
                    <div>
                      <span className="block">Free cancellation up to 24 hours before pickup. Contact us for any changes.</span>
                      <span className="mt-2 flex flex-wrap gap-3">
                        <a href="mailto:support@infiniatransfers.com" className={actionBtnClass}>
                          Email support
                        </a>
                        <a href="tel:+971501234567" className={actionBtnClass}>
                          +971 50 123 4567
                        </a>
                      </span>
                    </div>
                  </li>
                </ol>
              </div>
            </CardMotion>

            {/* Actions */}
            <motion.div
              className="space-y-6 pt-2 print:hidden"
              initial={skip ? false : { opacity: 0, y: 8 }}
              animate={skip ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: skip ? 0 : 0.3, ease: EASE_LUXURY }}
            >
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link href="/account" className="btn btn-primary">
                  View my bookings
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/" className="editorial-action min-h-[44px]">
                  Book another transfer
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <p className="text-[0.8125rem] text-[var(--text-muted)]">
                We look forward to welcoming you.
              </p>
            </motion.div>
          </div>

          {/* Pricing sidebar — desktop only */}
          {statusConfig.showPricing && (
            <aside
              className="hidden lg:block w-[380px] xl:w-[420px] flex-shrink-0 lg:sticky lg:top-24"
              aria-label="Payment summary"
            >
              <motion.div
                className={cardClass}
                initial={skip ? false : { opacity: 0, y: 8 }}
                animate={skip ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: skip ? 0 : 0.15, ease: EASE_LUXURY }}
              >
                <div className={cardHeaderClass}>
                  <h2 className="t-label">Payment Summary</h2>
                </div>
                <div className={cardBodyClass}>
                  {pricingSummary}
                </div>
              </motion.div>
            </aside>
          )}
        </motion.div>
      </div>
    </div>
  )
}
