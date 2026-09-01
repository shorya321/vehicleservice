'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { VehicleTypeResult } from '../actions'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { formatResultPrice } from './format-result-price'
import { useCurrency } from '@/lib/currency/context'
import { buildCheckoutUrl } from '@/lib/utils/url-builder'

/**
 * Photography grading.
 *
 * This started as a copy of the Dubai destinations treatment, which dims its
 * photos to brightness(0.6) because caption text sits on top of them and has to
 * stay legible. That purpose does not transfer: a vehicle card exists to show
 * the vehicle. Measured against the live assets, 0.6 took the Lexus ES from a
 * mean luminance of 64 to 38 and the V-Class from 65 to 39, i.e. to roughly 15%
 * of white, and a bottom scrim then sat on top of that. The cars disappeared.
 *
 * What is left is a light, neutral pass that takes the glare off the daylight
 * shots without hiding the night ones. It cannot make the set consistent on its
 * own: the source luminance spans 64 to 137, and closing that gap properly is an
 * asset job, not a CSS filter.
 */
const MEDIA_TOKENS = [
  '[--media-filter:saturate(0.94)_contrast(1.02)_brightness(1)]',
  'dark:[--media-filter:saturate(0.96)_contrast(1.04)_brightness(0.94)]',
].join(' ')

const SPEC_LABEL = 'text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]'

interface VehicleTypeGridCardProps {
  vehicleType: VehicleTypeResult
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
    adults?: string
    children?: string
    infants?: string
    originSlug?: string
    destSlug?: string
  }
  index?: number
}

export function VehicleTypeGridCard({ vehicleType, searchParams, index = 0 }: VehicleTypeGridCardProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const reduceMotion = useReducedMotion()
  const [imageError, setImageError] = useState(false)
  const vehicleTypeImage = vehicleType.image || `/images/vehicle-types/${vehicleType.slug}.jpg`
  // Vehicle type names are model names, so the subtitle shows the description instead
  // of repeating the heading.
  const subtitle = vehicleType.description?.trim() || ''

  // The guest breakdown is optional: links from route cards and zone pages only know a total.
  const toCount = (v: string | undefined) => {
    if (v === undefined) return undefined
    const n = parseInt(v)
    return Number.isNaN(n) ? undefined : n
  }

  const selectionUrl = searchParams.originSlug && searchParams.destSlug
    ? buildCheckoutUrl(searchParams.originSlug, searchParams.destSlug, vehicleType.slug, {
        date: searchParams.date || '',
        time: '10:00',
        passengers: searchParams.passengers || '1',
        adults: toCount(searchParams.adults),
        children: toCount(searchParams.children),
        infants: toCount(searchParams.infants),
      })
    : `/checkout?${new URLSearchParams({
        vehicleType: vehicleType.id,
        // Drop undefined entries. URLSearchParams stringifies them to the literal "undefined".
        ...Object.fromEntries(
          Object.entries(searchParams).filter(([, v]) => v !== undefined)
        ),
      }).toString()}`

  const unavailable = vehicleType.availableVehicles === 0

  return (
    <motion.article
      aria-label={unavailable ? `${vehicleType.name}, sold out` : vehicleType.name}
      className={`vehicle-card-surface group relative flex h-full flex-col rounded-[8px] border border-[var(--graphite)] bg-[var(--charcoal)] p-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${MEDIA_TOKENS} ${unavailable ? 'opacity-50' : 'hover:-translate-y-1 hover:border-[rgba(var(--gold-rgb),0.35)] hover:shadow-[0_12px_24px_-6px_rgba(var(--gold-rgb),0.15),0_4px_10px_-4px_rgba(var(--gold-rgb),0.1)] focus-within:border-[rgba(var(--gold-rgb),0.35)]'}`}
      // `animate` is ALWAYS supplied. The `reduceMotion ? undefined` idiom looks
      // equivalent and is not: useReducedMotion() is false during SSR, so
      // opacity:0 is serialised into the markup and never animated back once
      // hydration flips the flag. Reduced motion collapses offset and duration.
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.5,
        delay: reduceMotion ? 0 : index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-[8px] bg-[var(--black-warm)]">
        {imageError ? (
          <div className="absolute inset-0 bg-[var(--charcoal)] flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">{vehicleType.category}</div>
              <div className="mt-2 text-xl font-medium text-[var(--text-primary)]">{vehicleType.name}</div>
            </div>
          </div>
        ) : (
          <>
            <Image
              src={vehicleTypeImage}
              alt={vehicleType.name}
              fill
              // The first row is the LCP element on this page.
              priority={index < 3}
              className="object-cover [filter:var(--media-filter)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
        {/* Which tab this belongs to. Real information in the All view, where
            the categories are otherwise invisible. It used to sit on the photo,
            which is what forced a scrim over the vehicle. */}
        <p className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {vehicleType.category}
        </p>
        <h3 className="mt-1.5 text-[1.375rem] font-medium leading-[1.25] tracking-[-0.02em] text-[var(--text-primary)]">
          {vehicleType.name}
        </h3>

        {/* Two lines with a reserved height: one line cut sentences mid-word,
            and an unreserved second line left card bodies at ragged heights. */}
        <p className="mt-2 line-clamp-2 min-h-[2.9em] text-[0.84375rem] leading-[1.5] text-[var(--text-secondary)]">
          {subtitle}
        </p>

        <ul className="mt-3.5 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[0.65625rem] font-medium uppercase tracking-[0.11em] text-[var(--text-muted)]">
          <li className="inline-flex items-center gap-1.5 before:h-1 before:w-1 before:flex-none before:rounded-full before:bg-[var(--gold)] before:opacity-[0.65] before:content-['']">
            Free cancellation
          </li>
          <li className="inline-flex items-center gap-1.5 before:h-1 before:w-1 before:flex-none before:rounded-full before:bg-[var(--gold)] before:opacity-[0.65] before:content-['']">
            45 min free waiting
          </li>
        </ul>

        {/* Fixed columns so the two figures line up across every card in the
            row, whatever the digit count. */}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--graphite)] pt-4">
          <div className="flex items-baseline gap-2">
            <dt className={SPEC_LABEL}>Passengers</dt>
            <dd className="numeric text-[1rem] text-[var(--text-primary)]">{vehicleType.capacity}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className={SPEC_LABEL}>Luggage</dt>
            <dd className="numeric text-[1rem] text-[var(--text-primary)]">{vehicleType.luggageCapacity}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <div>
            <div className={SPEC_LABEL}>From</div>
            {/* Deliberately stacked, not wrapped. The caption fits beside a
                short price ("100 AED") but not a long one ("20.09 GBP"), so
                letting flex decide would put it inline for one currency and
                below for another and leave uneven card heights. */}
            <p className="mt-2 leading-none">
              <span className="numeric block text-[1.5rem] font-semibold leading-none tracking-[-0.02em] text-[var(--gold-text)]">
                {formatResultPrice(vehicleType.price, currentCurrency, exchangeRates)}
              </span>
              <span className="mt-2 block text-[0.65625rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                per vehicle
              </span>
            </p>
          </div>

          {unavailable ? (
            <span className="flex-none rounded-[4px] border border-[var(--graphite)] px-4 py-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Sold out
            </span>
          ) : (
            // The ::after overlay makes the whole card the target. People tap
            // the car, not the button; the button stays as the visible
            // affordance and keeps its own focus ring.
            <Link
              href={selectionUrl}
              className="inline-flex min-h-[48px] flex-none items-center gap-2 rounded-[4px] bg-[linear-gradient(180deg,var(--gold-cream)_0%,var(--gold)_38%,var(--gold-medium)_100%)] px-6 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[var(--onyx)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.28),0_10px_24px_-14px_rgba(var(--gold-rgb),0.5)] transition-all duration-300 hover:brightness-[1.06] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--charcoal)] after:absolute after:inset-0 after:rounded-[8px] after:content-['']"
              aria-label={`Select ${vehicleType.name}`}
            >
              Select
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  )
}
