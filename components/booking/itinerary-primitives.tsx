'use client'

import { motion } from 'motion/react'

/**
 * The Itinerary Block, as shared parts.
 *
 * DESIGN.md section 5 names this block the product's signature and requires every step of the
 * booking flow to re-use it. Until now "re-use" meant copy: components/checkout/booking-ledger.tsx
 * declared the label and band constants, app/booking/confirmation/components/confirmation-content.tsx
 * declared them again verbatim, and the account had a fourth vocabulary of its own. This module is
 * the single declaration those files now import.
 *
 * Nothing here is new. Every value is the one already shipping, moved rather than rewritten, so a
 * screenshot of checkout or of the confirmation page is identical either side of the extraction.
 */

/* ---------------------------------------------------------------- label tiers */

/**
 * Tier 2, the card/field label. Distinct from Tier 1, the section eyebrow
 * (.editorial-eyebrow / .account-eyebrow, 0.6875rem / 0.18em with a 28px gold rule), and from
 * Tier 3, the sentence-case caption. Mixing the tiers is what made checkout and confirmation
 * look like two products.
 */
export const CARD_LABEL = 'text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]'
export const CARD_LABEL_STRONG = 'text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]'

/* ---------------------------------------------------------------- surfaces */

export const CARD = 'bg-[var(--black-rich)] border border-[rgba(var(--gold-rgb),0.12)] rounded-[8px] overflow-hidden'
export const BAND = 'px-6 xl:px-8 py-5'
export const BAND_DIVIDER = 'border-t border-[rgba(var(--gold-rgb),0.1)]'

/** The total band. Gold at 3%, which is the only fill gold is allowed on a surface this size. */
export const TOTAL_BAND = 'border-t border-[rgba(var(--gold-rgb),0.15)] bg-[rgba(var(--gold-rgb),0.03)]'

/* ---------------------------------------------------------------- values */

/** Value line inside an itinerary segment. Title role: 1.0625rem / 500. */
export const SEGMENT_VALUE = 'mt-1.5 text-[1.0625rem] font-medium leading-snug text-[var(--text-primary)] break-words'
/** Tier 3 caption: sentence case, so a unit line cannot compete with the Tier 2 label above it. */
export const SEGMENT_CAPTION = 'mt-1 text-[0.75rem] leading-snug text-[var(--text-muted)]'

/* ---------------------------------------------------------------- controls */

export const GHOST_BUTTON =
  'inline-flex min-h-[44px] items-center gap-2 rounded-[4px] border border-[var(--graphite)] px-4 text-[0.75rem] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]'

/** The one easing curve. Mirrors --ease-luxury in globals.css. */
export const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1]

/* ---------------------------------------------------------------- route rail */

export interface RouteStopProps {
  label: string
  /** The stop itself. Omitted on a history stop, where the timestamp is the whole value. */
  address?: string
  /** A timestamp or other numeric line beneath the value. */
  meta?: string
  /** Last stop on the rail: no connector runs onward from it. */
  terminal?: boolean
  /**
   * Dot fill. Left undefined the dot follows `terminal`, which is exactly how the confirmation
   * page has always drawn it. Supplied, it separates "has happened" from "has not", which is what
   * lets the rail carry a trip's history below its route.
   */
  state?: 'done' | 'pending'
  reduceMotion: boolean
}

/**
 * One stop on the route rail. The rail is typographic per DESIGN.md section 5: dots and a
 * hairline, no icons. It replaced two sibling label/value cells, which stated both ends of a
 * journey and never the direction between them.
 */
export function RouteStop({ label, address, meta, terminal, state, reduceMotion }: RouteStopProps) {
  const filled = state ? state === 'done' : !!terminal

  return (
    <li className="relative pl-7">
      {/* Dot sits on the optical centre of the LABEL line (10px type at 1.2 => 6px), not the
          address, so the rail stays true when a long address wraps to two lines. */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-[1.5px] h-[9px] w-[9px] rounded-full border border-[var(--gold-text)] ${
          filled ? 'bg-[var(--gold-text)]' : 'bg-[var(--black-rich)]'
        }`}
      />
      {!terminal && (
        // Runs from this dot's underside into the next dot, so it must clear the 1.25rem list
        // gap plus that dot's own top offset. Scales from the origin it starts at.
        <motion.span
          aria-hidden="true"
          className="absolute bottom-[-1.4rem] left-[4px] top-[10.5px] w-px origin-top bg-[var(--graphite)]"
          initial={{ scaleY: reduceMotion ? 1 : 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.45, ease: EASE_LUXURY }}
        />
      )}
      <p className={CARD_LABEL}>{label}</p>
      {address && <p className={SEGMENT_VALUE}>{address}</p>}
      {meta && (
        <p className={`numeric ${address ? SEGMENT_CAPTION : 'mt-1.5 text-[0.8125rem] leading-snug text-[var(--text-secondary)]'}`}>
          {meta}
        </p>
      )}
    </li>
  )
}

/* ---------------------------------------------------------------- label/value pairs */

/** A label/value pair in a detail card. Kept as a grid cell, not a card. */
export function Field({
  label,
  value,
  className,
  numeric = false,
}: {
  label: string
  value: React.ReactNode
  className?: string
  numeric?: boolean
}) {
  return (
    <div className={`min-w-0 ${className ?? ''}`}>
      <dt className={CARD_LABEL}>{label}</dt>
      <dd className={`${numeric ? 'numeric ' : ''}${SEGMENT_VALUE}`}>{value}</dd>
    </div>
  )
}

/** One line of the ledger. The figure carries no currency code: the code is stated on the header. */
export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="min-w-0 truncate text-[0.875rem] text-[var(--text-secondary)]">{label}</dt>
      <dd className="numeric shrink-0 text-[0.875rem] text-[var(--text-primary)]">{value}</dd>
    </div>
  )
}

/* ---------------------------------------------------------------- reassurance */

/**
 * The three guarantees, copied verbatim from components/checkout/trust-block.tsx, which sources
 * every claim to app/terms/components/terms-content.tsx. Do not add a claim here that is not in
 * the Terms, and do not reword these without changing the Terms first.
 */
export const GUARANTEES = [
  {
    label: 'Cancellation',
    body: 'Free up to 24 hours before pickup. Full refund if we cancel on you.',
  },
  {
    label: 'Waiting time',
    body: '60 minutes free from your actual landing time, 45 minutes on other pickups.',
  },
  {
    label: 'Your chauffeur',
    body: 'Meets you inside arrivals with a name board and walks you to the vehicle.',
  },
] as const

/** The reassurance rail. Hairline rows, no badges: trust here is the absence of a badge. */
export function GuaranteeList({ id = 'guarantees-heading' }: { id?: string } = {}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className={CARD_LABEL_STRONG}>
        Included with every transfer
      </h2>
      <dl className="mt-5 flex flex-col">
        {GUARANTEES.map((item) => (
          <div key={item.label} className="mb-4 border-b border-[var(--graphite)] pb-4 last:mb-0">
            <dt className={CARD_LABEL}>{item.label}</dt>
            <dd className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
              {item.body}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ---------------------------------------------------------------- motion */

/**
 * Card entrance.
 *
 * `animate` is ALWAYS supplied. The `animate={skip ? undefined : ...}` idiom looks equivalent and
 * is not: useReducedMotion() is false during SSR, so `opacity: 0` is serialised into the markup,
 * and with no `animate` to run once hydration flips the flag a reduced-motion visitor is left
 * staring at an invisible card.
 */
export function CardMotion({
  children,
  reduceMotion,
  delay,
  className,
  ...rest
}: {
  children: React.ReactNode
  reduceMotion: boolean
  delay: number
  className?: string
  id?: string
  'aria-labelledby'?: string
}) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : delay, ease: EASE_LUXURY }}
      {...rest}
    >
      {children}
    </motion.section>
  )
}
