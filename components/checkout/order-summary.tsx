'use client'

import { useState, memo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Tag, ChevronDown, ChevronUp, ArrowRight, Check, Lock } from 'lucide-react'
import { TrustBlock } from './trust-block'
import { BookingLedger } from './booking-ledger'
import { RouteDetails, VehicleTypeDetails } from '@/app/checkout/actions'
import { OrderSummaryAddon } from './checkout-wrapper'

interface OrderSummaryProps {
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  passengers: number
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
    <>
    <motion.aside
      aria-label="Order summary"
      className="bg-[var(--black-rich)] border border-[rgba(var(--gold-rgb),0.12)] rounded-[8px] overflow-hidden"
      // `whileInView` is ALWAYS supplied. The `reduceMotion ? undefined` idiom looks
      // equivalent and is not: useReducedMotion() is false during SSR, so opacity:0 is
      // serialised into the markup and never animated back once hydration flips the
      // flag. Reduced motion collapses offset and duration.
      initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
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
        luggage={vehicleType.luggage_capacity}
        basePrice={basePrice}
        addons={selectedAddons}
        promoDiscount={promoDiscount}
        total={total}
        onRemoveAddon={onRemoveAddon}
      />

      {/* Promo Code. Compact toggle */}
      <div className="border-t border-[rgba(var(--gold-rgb),0.1)] px-6 xl:px-8 py-4">
        <button
          type="button"
          onClick={() => setShowPromo(!showPromo)}
          aria-expanded={showPromo}
          className="flex items-center gap-2 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] hover:text-[var(--gold-text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]"
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
              className="h-10 px-4 text-[0.75rem] font-medium border border-[var(--graphite)] rounded text-[var(--gold-text)] hover:bg-[var(--charcoal)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]"
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
      <footer className="border-t border-[rgba(var(--gold-rgb),0.1)] px-6 xl:px-8 py-5 space-y-4">
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

    {/* Fills the empty half of the column, and answers the page having had exactly one
        line of trust copy. Every claim here is from the Terms. */}
    <TrustBlock />
    </>
  )
})
