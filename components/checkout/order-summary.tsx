'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import { Tag, ChevronDown, ChevronUp, ArrowRight, Check, Info, Lock } from 'lucide-react'
import { RouteDetails, VehicleTypeDetails } from '@/app/checkout/actions'
import { OrderSummaryAddon } from './checkout-wrapper'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'

interface OrderSummaryProps {
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  passengers: number
  luggage: number
  infantSeats?: number
  boosterSeats?: number
  pickupDate?: string
  pickupTime?: string
  onSubmit?: () => void
  isSubmitting?: boolean
  agreeToTerms?: boolean
  onAgreeToTermsChange?: (checked: boolean) => void
  selectedAddons?: OrderSummaryAddon[]
}

const inputClass =
  'w-full h-11 bg-[var(--black-warm)] border border-[var(--graphite)] rounded-[4px] px-3 text-[0.875rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/25 transition-[border,box-shadow] duration-200'

export function OrderSummary({
  route,
  vehicleType,
  passengers,
  luggage,
  infantSeats = 0,
  boosterSeats = 0,
  pickupDate,
  pickupTime,
  onSubmit,
  isSubmitting = false,
  agreeToTerms = false,
  onAgreeToTermsChange,
  selectedAddons = [],
}: OrderSummaryProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const reduceMotion = useReducedMotion()

  const formatUserPrice = (amount: number) => formatPrice(amount, currentCurrency, exchangeRates)
  const isConverted = currentCurrency !== 'AED'

  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [showPromo, setShowPromo] = useState(false)

  const basePrice = vehicleType.price || 50
  const extraLuggageCount = Math.max(0, luggage - vehicleType.luggage_capacity)
  const extraLuggageCost = extraLuggageCount * 15
  const childSeatsCost = (infantSeats + boosterSeats) * 10
  const addonsCost = selectedAddons.reduce((sum, addon) => sum + addon.total_price, 0)
  const subtotal = basePrice + extraLuggageCost + childSeatsCost + addonsCost
  const total = subtotal - promoDiscount

  const formattedDate = pickupDate
    ? new Date(pickupDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : ''

  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === 'SAVE10') {
      setPromoDiscount(basePrice * 0.1)
      setPromoApplied(true)
    } else {
      setPromoDiscount(0)
      setPromoApplied(false)
    }
  }

  const itinerary: { label: string; value: React.ReactNode }[] = [
    { label: 'From', value: route.origin.name },
    { label: 'To', value: route.destination.name },
    formattedDate ? { label: 'Date', value: <span className="numeric">{formattedDate}</span> } : null,
    pickupTime ? { label: 'Time', value: <span className="numeric">{pickupTime}</span> } : null,
    { label: 'Pax', value: <span className="numeric">{passengers}</span> },
    { label: 'Bags', value: <span className="numeric">{vehicleType.luggage_capacity}</span> },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[]

  return (
    <motion.aside
      aria-label="Order summary"
      className="bg-[var(--black-rich)] border border-[var(--graphite)]"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <header className="border-b border-[var(--graphite)] px-6 py-5">
        <div className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Itinerary · summary
        </div>
        <h2 className="mt-1 font-display text-xl text-[var(--text-primary)]">
          {vehicleType.name}
        </h2>
      </header>

      {vehicleType.image_url && (
        <div className="border-b border-[var(--graphite)]">
          <div className="relative h-32 w-full overflow-hidden bg-[var(--black-warm)]">
            <Image
              src={vehicleType.image_url}
              alt={vehicleType.name}
              fill
              className="object-cover"
              sizes="420px"
            />
          </div>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-[var(--graphite)] px-6 py-5 text-[0.875rem]">
        {itinerary.map((item) => (
          <div key={item.label}>
            <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {item.label}
            </dt>
            <dd className="mt-1 text-[var(--text-primary)]">{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="border-b border-[var(--graphite)] px-6 py-5">
        <button
          type="button"
          onClick={() => setShowPromo(!showPromo)}
          aria-expanded={showPromo}
          className="flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.16em] text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]"
        >
          <Tag className="h-4 w-4" aria-hidden="true" />
          Have a promo code?
          {showPromo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showPromo && (
          <div className="mt-3 flex gap-2">
            <input
              placeholder="Enter code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className={inputClass + ' flex-1'}
            />
            <button
              type="button"
              onClick={applyPromoCode}
              className="btn btn-secondary h-11 px-4 text-[0.75rem]"
            >
              Apply
            </button>
          </div>
        )}

        {promoApplied && (
          <p className="mt-2 flex items-center gap-1 text-[0.75rem] text-[var(--gold)]">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Promo applied.
          </p>
        )}
      </div>

      <div className="border-b border-[var(--graphite)] px-6 py-5 space-y-2.5 text-[0.875rem]">
        <PriceRow label="Base fare" value={formatUserPrice(basePrice)} />
        {childSeatsCost > 0 && (
          <PriceRow
            label={`Child seats (${infantSeats + boosterSeats})`}
            value={formatUserPrice(childSeatsCost)}
          />
        )}
        {extraLuggageCost > 0 && (
          <PriceRow
            label={`Extra luggage (${extraLuggageCount})`}
            value={formatUserPrice(extraLuggageCost)}
          />
        )}
        {selectedAddons.map((addon) => (
          <PriceRow
            key={addon.id}
            label={`${addon.name}${addon.quantity > 1 ? ` × ${addon.quantity}` : ''}`}
            value={formatUserPrice(addon.total_price)}
          />
        ))}
        {promoDiscount > 0 && (
          <PriceRow
            label="Promo discount"
            value={`−${formatUserPrice(promoDiscount)}`}
            tone="positive"
          />
        )}
      </div>

      <div className="px-6 py-5">
        <div className="flex items-baseline justify-between">
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Total
          </span>
          <span className="numeric text-3xl text-[var(--text-primary)]">
            {formatUserPrice(total)}
          </span>
        </div>
        {isConverted && (
          <p className="mt-3 flex items-start gap-2 text-[0.75rem] text-[var(--text-muted)]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Shown in {currentCurrency}. Charged in AED ({formatPrice(total, 'AED', exchangeRates)}).
            </span>
          </p>
        )}
      </div>

      <footer className="border-t border-[var(--graphite)] px-6 py-5 space-y-4">
        {onAgreeToTermsChange && (
          <label htmlFor="agree-terms" className="flex cursor-pointer items-start gap-3">
            <input
              id="agree-terms"
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => onAgreeToTermsChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 appearance-none border border-[var(--graphite)] bg-[var(--black-warm)] checked:border-[var(--gold)] checked:bg-[var(--gold)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]"
            />
            <span className="text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
              I agree to the{' '}
              <a href="/terms" className="text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-[var(--gold)] hover:text-[var(--gold-pale)] transition-colors">
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
            className="btn btn-primary h-12 w-full disabled:opacity-50"
          >
            {isSubmitting ? (
              'Processing'
            ) : (
              <>
                Confirm booking
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        )}

        <p className="flex items-center justify-center gap-2 text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          <Lock className="h-3.5 w-3.5 text-[var(--gold)]" aria-hidden="true" />
          Encrypted · SSL secure
        </p>
      </footer>
    </motion.aside>
  )
}

function PriceRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'positive'
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span
        className={
          tone === 'positive'
            ? 'numeric text-[var(--gold)]'
            : 'numeric text-[var(--text-primary)]'
        }
      >
        {value}
      </span>
    </div>
  )
}
