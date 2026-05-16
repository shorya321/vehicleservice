'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { Copy, Check, Printer, Info, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'

interface ConfirmationContentProps {
  booking: any
  primaryPassenger: any
  childSeats: any[]
  extraLuggage: any
  addons: any[]
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

  const formatUserPrice = (amount: number) => formatPrice(amount, currentCurrency, exchangeRates)
  const isConverted = currentCurrency !== 'AED'

  const copyBookingNumber = async () => {
    try {
      await navigator.clipboard.writeText(booking.booking_number)
      setCopied(true)
      toast.success('Booking reference copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const pickupDate = new Date(booking.pickup_datetime)

  return (
    <div className="min-h-screen bg-[var(--black-void)] py-12 md:py-20">
      <div className="luxury-container max-w-5xl">
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="editorial-eyebrow">
            Confirmed
            <span className="ml-3 numeric text-[var(--text-muted)]">№ {booking.booking_number}</span>
          </div>
          <h1 className="editorial-headline mt-6 text-[clamp(2.5rem,5.5vw,4.25rem)]">
            Your transfer is <em>booked.</em>
          </h1>
          <p className="mt-6 max-w-xl text-[1rem] leading-relaxed text-[var(--text-secondary)]">
            A confirmation has been sent to{' '}
            <span className="text-[var(--text-primary)]">{primaryPassenger?.email || 'your email'}</span>
            . Your chauffeur will contact you 30 minutes before pickup.
          </p>
        </motion.header>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button
            onClick={copyBookingNumber}
            className="inline-flex h-10 items-center gap-2 border border-[var(--graphite)] px-4 text-[0.75rem] uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
            aria-label="Copy booking reference"
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy reference'}
          </button>
          <button
            onClick={() => window.print()}
            className="print:hidden inline-flex h-10 items-center gap-2 border border-[var(--graphite)] px-4 text-[0.75rem] uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
            aria-label="Print confirmation"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Print
          </button>
        </div>

        <motion.section
          aria-labelledby="itinerary-heading"
          className="mt-12 border-t border-[var(--graphite)] pt-8"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 id="itinerary-heading" className="sr-only">Itinerary</h2>

          <dl className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            <div>
              <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">From</dt>
              <dd className="mt-2 font-display text-2xl leading-tight text-[var(--text-primary)]">
                {booking.pickup_address}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">To</dt>
              <dd className="mt-2 font-display text-2xl leading-tight text-[var(--text-primary)]">
                {booking.dropoff_address}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">Date</dt>
              <dd className="numeric mt-2 text-xl text-[var(--text-primary)]">
                {format(pickupDate, 'EEE · d MMM yyyy')}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">Pickup time</dt>
              <dd className="numeric mt-2 text-xl text-[var(--text-primary)]">
                {format(pickupDate, 'HH:mm')}
              </dd>
            </div>
          </dl>
        </motion.section>

        {booking.vehicle_type && (
          <section
            aria-labelledby="vehicle-heading"
            className="mt-10 border-t border-[var(--graphite)] pt-8"
          >
            <h2 id="vehicle-heading" className="sr-only">Vehicle</h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-[1fr_auto_auto] md:items-baseline">
              <div>
                <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">Vehicle</dt>
                <dd className="mt-2 font-display text-2xl text-[var(--text-primary)]">{booking.vehicle_type.name}</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">Pax</dt>
                <dd className="numeric mt-2 text-xl text-[var(--text-primary)]">
                  {booking.passenger_count} / {booking.vehicle_type.passenger_capacity}
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">Bags</dt>
                <dd className="numeric mt-2 text-xl text-[var(--text-primary)]">
                  {booking.luggage_count || 0} / {booking.vehicle_type.luggage_capacity}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {primaryPassenger && (
          <section
            aria-labelledby="passenger-heading"
            className="mt-10 border-t border-[var(--graphite)] pt-8"
          >
            <h2 id="passenger-heading" className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Lead passenger
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
              <div>
                <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Name</dt>
                <dd className="mt-1 text-[var(--text-primary)]">
                  {primaryPassenger.first_name} {primaryPassenger.last_name}
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Email</dt>
                <dd className="mt-1 text-[var(--text-primary)]">{primaryPassenger.email}</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Phone</dt>
                <dd className="numeric mt-1 text-[var(--text-primary)]">{primaryPassenger.phone}</dd>
              </div>
            </dl>
          </section>
        )}

        <section
          aria-labelledby="summary-heading"
          className="mt-10 border-t border-[var(--graphite)] pt-8"
        >
          <h2 id="summary-heading" className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Summary
          </h2>
          <dl className="mt-4 space-y-2.5 text-[0.9375rem]">
            <Row
              label={`Base fare · ${booking.passenger_count} passenger${booking.passenger_count > 1 ? 's' : ''}`}
              value={formatUserPrice(booking.base_price)}
            />
            {childSeats.map((seat: any, idx: number) => (
              <Row
                key={`seat-${idx}`}
                label={`${seat.amenity_type === 'child_seat_infant' ? 'Infant seat' : 'Booster seat'}${seat.quantity > 1 ? ` × ${seat.quantity}` : ''}`}
                value={formatUserPrice(seat.price)}
              />
            ))}
            {extraLuggage && (
              <Row
                label={`Extra luggage × ${extraLuggage.quantity}`}
                value={formatUserPrice(extraLuggage.price)}
              />
            )}
            {addons.map((addon: any, idx: number) => (
              <Row
                key={`addon-${idx}`}
                label={`${addon.addon?.name || 'Add-on'}${addon.quantity > 1 ? ` × ${addon.quantity}` : ''}`}
                value={formatUserPrice(addon.price)}
              />
            ))}
          </dl>

          <div className="mt-6 flex items-baseline justify-between border-t border-[var(--graphite)] pt-6">
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Total paid
            </span>
            <span className="numeric text-3xl text-[var(--text-primary)]">
              {formatUserPrice(booking.total_price)}
            </span>
          </div>

          {isConverted && (
            <p className="mt-3 flex items-start gap-2 text-[0.75rem] text-[var(--text-muted)]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                Shown in {currentCurrency}. Charged in AED ({formatPrice(booking.total_price, 'AED', exchangeRates)}).
              </span>
            </p>
          )}
        </section>

        {booking.customer_notes && (
          <section
            aria-labelledby="notes-heading"
            className="mt-10 border-t border-[var(--graphite)] pt-8"
          >
            <h2 id="notes-heading" className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Notes from you
            </h2>
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
              {booking.customer_notes}
            </p>
          </section>
        )}

        <section
          aria-labelledby="next-heading"
          className="mt-10 border-t border-[var(--graphite)] pt-8"
        >
          <h2 id="next-heading" className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
            What happens next
          </h2>
          <ol className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
            <li className="flex gap-4">
              <span className="numeric shrink-0 text-[0.75rem] text-[var(--gold)] tracking-[0.16em]">01</span>
              <span>Be ready at your pickup location 5 minutes before the scheduled time.</span>
            </li>
            <li className="flex gap-4">
              <span className="numeric shrink-0 text-[0.75rem] text-[var(--gold)] tracking-[0.16em]">02</span>
              <span>Your chauffeur will wait up to 15 minutes past the scheduled pickup (60 minutes for airport meet-and-greet).</span>
            </li>
            <li className="flex gap-4">
              <span className="numeric shrink-0 text-[0.75rem] text-[var(--gold)] tracking-[0.16em]">03</span>
              <span>Free cancellation up to 24 hours before pickup. Contact support for any change.</span>
            </li>
          </ol>
        </section>

        <motion.div
          className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-[var(--graphite)] pt-8 print:hidden"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/account" className="btn btn-primary">
            View my bookings
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/" className="editorial-action">
            Book another transfer
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[var(--text-secondary)]">{label}</dt>
      <dd className="numeric text-[var(--text-primary)]">{value}</dd>
    </div>
  )
}
