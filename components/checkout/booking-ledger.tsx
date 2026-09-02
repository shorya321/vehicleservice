'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Info, X } from 'lucide-react'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'

/** Hoisted so the card's label treatment cannot drift copy by copy. Tier 2. */
const CARD_LABEL = 'text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]'
const CARD_LABEL_STRONG = 'text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]'

const BAND = 'px-6 xl:px-8 py-5'
const BAND_DIVIDER = 'border-t border-[rgba(var(--gold-rgb),0.1)]'

export interface LedgerAddon {
  id: string
  name: string
  quantity: number
  total_price: number
}

interface BookingLedgerProps {
  category?: string | null
  vehicleName: string
  originName: string
  destinationName: string
  /** Pre-formatted in the operating timezone by the caller. */
  dateLabel?: string
  timeLabel?: string
  passengers: number
  luggage?: number | null
  basePrice: number
  addons?: LedgerAddon[]
  promoDiscount?: number
  total: number
  /** Omitted on the payment step, where the booking is already created and priced. */
  onRemoveAddon?: (addonId: string) => void
}

/**
 * Row entrance/exit. Motion propagates the active variant label to child motion components, so
 * the value's colour settle below rides on the same labels without needing to know whether the
 * row is new — `AnimatePresence initial={false}` already answers that.
 */
const ROW_VARIANTS = {
  initial: { opacity: 0, height: 0, y: -4 },
  animate: { opacity: 1, height: 'auto', y: 0 },
  exit: { opacity: 0, height: 0, y: -4 },
}

const ROW_VARIANTS_REDUCED = {
  initial: { opacity: 0, height: 0, y: 0 },
  animate: { opacity: 1, height: 'auto', y: 0 },
  exit: { opacity: 0, height: 0, y: 0 },
}

/** Gold on arrival, settling to the resting ink. The second of gold's two permitted jobs. */
const VALUE_VARIANTS = {
  initial: { color: 'var(--gold-text)' },
  animate: { color: 'var(--text-primary)' },
}

function LedgerRow({
  label,
  value,
  tone,
  onRemove,
  removeLabel,
  animateValue = false,
}: {
  label: string
  value: string
  tone?: 'positive'
  onRemove?: () => void
  removeLabel?: string
  /** Only the rows inside AnimatePresence, which supplies the variant labels. */
  animateValue?: boolean
}) {
  const reduceMotion = useReducedMotion()

  const valueClass = `font-medium tabular-nums ${
    tone === 'positive' ? 'text-[var(--gold-text)]' : 'text-[var(--text-primary)]'
  }`

  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="flex items-baseline gap-1.5 shrink-0">
        {animateValue && !reduceMotion ? (
          <motion.span
            variants={VALUE_VARIANTS}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-medium tabular-nums"
          >
            {value}
          </motion.span>
        ) : (
          <span className={valueClass}>{value}</span>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] text-[var(--text-muted)] transition-colors hover:text-[var(--gold-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </span>
    </div>
  )
}

/**
 * The summary card's body: vehicle header, itemised ledger, total band.
 *
 * Extracted so the checkout's OrderSummary and the payment page's aside stop drawing the same
 * booking two different ways. They previously disagreed on the route (an arrow line here, bullet
 * dots and icon chips there) and, more importantly, on when to show a breakdown at all: this side
 * suppressed `Base fare` while it equalled the total, the payment side printed `110.00 / 110.00`.
 *
 * Renders bands, not a container. The caller supplies the bordered card so it can append its own
 * sections (promo, terms, CTA) after the total.
 */
export function BookingLedger({
  category,
  vehicleName,
  originName,
  destinationName,
  dateLabel,
  timeLabel,
  passengers,
  luggage,
  basePrice,
  addons = [],
  promoDiscount = 0,
  total,
  onRemoveAddon,
}: BookingLedgerProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const reduceMotion = useReducedMotion()

  const formatUserPrice = (amount: number) => formatPrice(amount, currentCurrency, exchangeRates)
  const isConverted = currentCurrency !== 'AED'

  // A single row repeating the number directly below it reads as a broken breakdown, not a
  // simple one, so the block only appears once there is something to break down.
  const hasBreakdown = addons.length > 0 || promoDiscount > 0

  return (
    <>
      <div className={BAND}>
        {category && <div className={CARD_LABEL}>{category}</div>}
        <h2 className="mt-1 text-[1.375rem] font-semibold text-[var(--text-primary)]">
          {vehicleName}
        </h2>

        <div className="mt-4 flex items-center gap-1.5 text-[0.875rem] text-[var(--text-secondary)]">
          <span>{originName}</span>
          <ArrowRight className="h-3 w-3 shrink-0 text-[var(--gold-text)]" aria-hidden="true" />
          <span>{destinationName}</span>
        </div>

        {(dateLabel || timeLabel) && (
          <div className="mt-1.5 text-[0.875rem] tabular-nums text-[var(--text-muted)]">
            {dateLabel}
            {dateLabel && timeLabel ? ' · ' : ''}
            {timeLabel}
          </div>
        )}

        <div className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
          {passengers} pax
          {/* A booking with no luggage recorded should say nothing, not "0 bags". */}
          {luggage ? ` · ${luggage} bags` : ''}
        </div>
      </div>

      {hasBreakdown && (
        <div className={`${BAND_DIVIDER} ${BAND} text-[0.875rem]`}>
          <LedgerRow label="Base fare" value={formatUserPrice(basePrice)} />

          {/* `initial={false}` so rows already present when the card mounts render at rest;
              rows added later run initial -> animate and get both the slide and the gold
              settle. Height animates on the wrapper and the spacing lives inside it, so a
              removed row takes its gap with it instead of leaving a hole. */}
          <AnimatePresence initial={false}>
            {addons.map((addon) => (
              <motion.div
                key={addon.id}
                className="overflow-hidden"
                variants={reduceMotion ? ROW_VARIANTS_REDUCED : ROW_VARIANTS}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="pt-2.5">
                  <LedgerRow
                    label={`${addon.name}${addon.quantity > 1 ? ` × ${addon.quantity}` : ''}`}
                    value={formatUserPrice(addon.total_price)}
                    animateValue
                    onRemove={onRemoveAddon ? () => onRemoveAddon(addon.id) : undefined}
                    removeLabel={`Remove ${addon.name}`}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {promoDiscount > 0 && (
            <div className="pt-2.5">
              <LedgerRow
                label="Promo discount"
                value={`−${formatUserPrice(promoDiscount)}`}
                tone="positive"
              />
            </div>
          )}
        </div>
      )}

      <div className={`border-t border-[rgba(var(--gold-rgb),0.15)] bg-[rgba(var(--gold-rgb),0.03)] ${BAND}`}>
        <div className="flex items-baseline justify-between gap-3">
          <span className={CARD_LABEL_STRONG}>Total</span>
          <motion.span
            key={total}
            className="t-price inline-block"
            initial={{
              scale: reduceMotion ? 1 : 1.04,
              color: reduceMotion ? 'var(--text-primary)' : 'var(--gold-text)',
            }}
            animate={{ scale: 1, color: 'var(--text-primary)' }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {formatUserPrice(total)}
          </motion.span>
        </div>
        {/* The strongest claim the business has, stated where the number is. */}
        <p className="mt-2.5 text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
          Includes the vehicle, chauffeur, fuel, tolls and parking. No surge, no tip prompt.
        </p>
        {isConverted && (
          <p className="mt-2 flex items-start gap-2 text-[0.75rem] text-[var(--text-muted)]">
            <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            <span>
              Shown in {currentCurrency}. Charged in AED ({formatPrice(total, 'AED', exchangeRates)}).
            </span>
          </p>
        )}
      </div>
    </>
  )
}

BookingLedger.displayName = 'BookingLedger'
