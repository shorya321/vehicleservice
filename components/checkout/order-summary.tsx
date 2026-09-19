'use client'

import { useState, memo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Tag, ChevronDown, ChevronUp, ArrowRight, Check, Lock } from 'lucide-react'
import { BookingLedger } from './booking-ledger'
import { RouteDetails, VehicleTypeDetails } from '@/app/checkout/actions'
import { OrderSummaryAddon } from './checkout-wrapper'
import type { GuestBreakdown } from '@/components/home/hero/guest-breakdown'

/**
 * Pickup wall-clock plus the route's estimate, as a wall-clock string.
 *
 * Deliberately not a Date: both ends are already in the operating timezone (the picker writes
 * one, the route stores minutes), so this is arithmetic on a displayed time and converting it
 * through a Date would only invite a zone shift. Returns null rather than guessing when either
 * input is missing or malformed.
 */
function arrivalClock(pickupTime?: string, durationMinutes?: number | null): string | null {
  if (!pickupTime || !durationMinutes) return null
  const [h, m] = pickupTime.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  const total = h * 60 + m + durationMinutes
  const hh = Math.floor(total / 60) % 24
  return `${String(hh).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

interface OrderSummaryProps {
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  passengers: number
  /** The adults/children/infants behind `passengers`, where the form has told us. */
  guests?: GuestBreakdown
  pickupDate?: string
  pickupTime?: string
  currentStep?: number
  onSubmit?: () => void
  /** Advances the wizard from the details step. The card previously showed a disabled
      sentence here, in the exact spot the eye looks for the button. */
  onContinue?: () => void
  isSubmitting?: boolean
  agreeToTerms?: boolean
  onAgreeToTermsChange?: (checked: boolean) => void
  selectedAddons?: OrderSummaryAddon[]
  /** Only wired on the extras step, where AdditionalServicesSection is mounted to receive it. */
  onRemoveAddon?: (addonId: string) => void
}

export const OrderSummary = memo(function OrderSummary({
  route,
  vehicleType,
  passengers,
  guests,
  pickupDate,
  pickupTime,
  currentStep,
  onSubmit,
  onContinue,
  isSubmitting = false,
  agreeToTerms = false,
  onAgreeToTermsChange,
  selectedAddons = [],
  onRemoveAddon,
}: OrderSummaryProps) {
  const reduceMotion = useReducedMotion()

  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [showPromo, setShowPromo] = useState(false)

  const basePrice = vehicleType.price || 50
  const addonsCost = selectedAddons.reduce((sum, addon) => sum + addon.total_price, 0)
  const subtotal = basePrice + addonsCost
  const total = subtotal - promoDiscount

  const formattedDate = pickupDate
    ? new Date(pickupDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : ''

  const arrival = arrivalClock(pickupTime, route.estimated_duration_minutes)

  const applyPromoCode = () => {
    if (process.env.NODE_ENV === 'development' && promoCode.toUpperCase() === 'SAVE10') {
      setPromoDiscount(basePrice * 0.1)
      setPromoApplied(true)
    } else {
      setPromoDiscount(0)
      setPromoApplied(false)
    }
  }

  return (
    <motion.aside
      // Named by the visible eyebrow in checkout-wrapper, not by a duplicate string.
      aria-labelledby="order-summary-heading"
      className="checkout-summary-card"
      // `whileInView` is ALWAYS supplied. The `reduceMotion ? undefined` idiom looks
      // equivalent and is not: useReducedMotion() is false during SSR, so opacity:0 is
      // serialised into the markup and never animated back once hydration flips the
      // flag. Reduced motion collapses offset and duration.
      initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* The stub's cap. The eyebrow used to sit outside the card, level with the form's first
          section label; inside it, it names the object rather than the column, and the route's
          two hard numbers get the slot opposite. */}
      <div className="checkout-stub-cap">
        <h2 id="order-summary-heading" className="checkout-section-title editorial-eyebrow--pill"><i aria-hidden="true" />Your transfer</h2>
        {(route.distance_km || route.estimated_duration_minutes) ? (
          <span className="checkout-stub-ref">
            {route.distance_km ? `${Math.round(route.distance_km)} km` : ''}
            {route.distance_km && route.estimated_duration_minutes ? ' · ' : ''}
            {route.estimated_duration_minutes ? `${route.estimated_duration_minutes} min` : ''}
          </span>
        ) : null}
      </div>

      {/* Vehicle header, itemised ledger and total. Shared verbatim with the payment step so
          the same card follows the customer through to the card form. */}
      <BookingLedger
        category={vehicleType.category}
        vehicleName={vehicleType.name}
        originName={route.origin.name}
        destinationName={route.destination.name}
        dateLabel={formattedDate}
        timeLabel={pickupTime}
        passengers={passengers}
        guestBreakdown={guests ?? null}
        luggage={vehicleType.luggage_capacity}
        seats={vehicleType.passenger_capacity}
        pickupNote={pickupTime ? `Pickup ${pickupTime}` : null}
        arrivalNote={arrival ? `Arrive about ${arrival}` : null}
        alwaysShowBase
        basePrice={basePrice}
        addons={selectedAddons}
        promoDiscount={promoDiscount}
        total={total}
        onRemoveAddon={onRemoveAddon}
      />

      {/* Promo Code. Compact toggle */}
      <div className="border-t border-[var(--stub-line)] px-6 xl:px-8 py-4">
        <button
          type="button"
          onClick={() => setShowPromo(!showPromo)}
          aria-expanded={showPromo}
          className="flex items-center gap-2 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] hover:text-[var(--gold-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--stub-bot)]"
        >
          <Tag className="h-3 w-3" aria-hidden="true" />
          Have a code?
          {showPromo ? <ChevronUp className="h-3 w-3" aria-hidden="true" /> : <ChevronDown className="h-3 w-3" aria-hidden="true" />}
        </button>

        {showPromo && (
          <div className="mt-3 flex gap-2">
            <input
              placeholder="Enter code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              aria-label="Promo code"
              className="flex-1 h-10 bg-[var(--black-warm)] border border-[var(--graphite)] rounded px-3 text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/15 transition-[border,box-shadow] duration-200"
            />
            <button
              type="button"
              onClick={applyPromoCode}
              className="h-10 px-4 text-[0.75rem] font-medium border border-[var(--graphite)] rounded text-[var(--gold-text)] hover:bg-[var(--charcoal)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--stub-bot)]"
            >
              Apply
            </button>
          </div>
        )}

        <div aria-live="polite" aria-atomic="true">
          {promoApplied && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[0.75rem] text-[var(--gold-text)]">
              <Check className="h-3 w-3" aria-hidden="true" />
              Promo applied
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--stub-line)] px-6 xl:px-8 py-5 space-y-4">
        {(currentStep === undefined || currentStep === 1) ? (
          <>
            {onAgreeToTermsChange && (
              <label htmlFor="agree-terms" className="flex cursor-pointer items-start gap-3">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => onAgreeToTermsChange(e.target.checked)}
                  className="checkout-checkbox mt-0.5"
                />
                <span className="text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
                  I agree to the{' '}
                  <a href="/terms" className="text-[var(--gold-text)] hover:text-[var(--text-primary)] transition-colors">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-[var(--gold-text)] hover:text-[var(--text-primary)] transition-colors">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
            )}

            {onSubmit && (
              <button
                type="submit"
                disabled={isSubmitting || !agreeToTerms}
                onClick={onSubmit}
                className="checkout-btn-primary w-full"
                aria-describedby={!agreeToTerms ? 'submit-disabled-reason' : undefined}
              >
                {isSubmitting ? (
                  'Processing'
                ) : (
                  <>
                    Proceed to payment
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            )}

            {!agreeToTerms && (
              <p id="submit-disabled-reason" className="sr-only">
                Accept the terms and privacy policy to continue
              </p>
            )}
          </>
        ) : (
          /* This was a disabled sentence gating nothing, sitting in the exact spot the
             eye searches for the button. It becomes the action for this step. */
          onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="checkout-btn-primary w-full"
            >
              Continue to extras
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )
        )}

        {/* One reassurance, sentence case. It used to be an uppercase tracked line stacked
            under a second one ("You won't be charged yet"), which made a single fact read as
            two worries. The "not charged yet" promise now rides on this line. */}
        <p className="flex items-center justify-center gap-2 text-[0.75rem] text-[var(--text-muted)]">
          <Lock className="h-3 w-3 text-[var(--gold-text)]" aria-hidden="true" />
          {(currentStep === undefined || currentStep === 1)
            ? 'Encrypted · you are not charged yet'
            : 'Encrypted · SSL secure'}
        </p>
      </footer>
    </motion.aside>
  )
})
