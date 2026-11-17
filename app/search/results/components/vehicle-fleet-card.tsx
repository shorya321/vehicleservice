'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight, Briefcase, Check, Clock, Users } from 'lucide-react'
import type { VehicleTypeResult } from '../actions'
import { formatResultPrice } from './format-result-price'
import { useCurrency } from '@/lib/currency/context'
import { buildSelectionUrl, type ResultsSearchParams } from './results-search-params'
import { PriceMeter } from './price-meter'
import { splitVehicleName } from './vehicle-name'

interface VehicleFleetCardProps {
  vehicleType: VehicleTypeResult
  searchParams: ResultsSearchParams
  /** Position on the page. The first row is the LCP, so it loads with priority. */
  index?: number
  /** Price level of the vehicle's class, when the page has more than one class. */
  level?: number
  /** h4 under a class header, h3 in the flat list that has none. */
  headingLevel?: 'h3' | 'h4'
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

/** Select's target. Same logic as the card it replaces: the slug route, else the legacy query checkout. */
function selectionHref(vehicleType: VehicleTypeResult, searchParams: ResultsSearchParams): string {
  return buildSelectionUrl(searchParams, vehicleType.slug)
    ?? `/checkout?${new URLSearchParams({
      vehicleType: vehicleType.id,
      // Drop undefined and non-string entries. URLSearchParams stringifies them to "undefined".
      ...Object.fromEntries(
        Object.entries(searchParams).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string'
        )
      ),
    }).toString()}`
}

export function VehicleFleetCard({ vehicleType, searchParams, index = 0, level, headingLevel = 'h3' }: VehicleFleetCardProps) {
  const Heading = headingLevel
  const { currentCurrency, exchangeRates } = useCurrency()
  const reduceMotion = useReducedMotion()
  const [imageError, setImageError] = useState(false)

  const image = vehicleType.image || `/images/vehicle-types/${vehicleType.slug}.jpg`
  const { make, model } = splitVehicleName(vehicleType.name)
  const description = vehicleType.description?.trim() || ''
  const unavailable = vehicleType.availableVehicles === 0
  const unavailableLabel = vehicleType.unavailableReason ?? 'Sold out'
  const tripPricing = vehicleType.tripPricing
  const hasPricingNotes = !!tripPricing
    && (tripPricing.details.length > 0 || (tripPricing.extraHourPrice ?? 0) > 0)

  return (
    <motion.article
      aria-label={unavailable ? `${vehicleType.name}, ${unavailableLabel}` : vehicleType.name}
      className={`fleet-card group ${unavailable ? 'fleet-card--out' : ''}`}
      // `animate` is always supplied: useReducedMotion() is false during SSR, so
      // leaving it undefined would serialise opacity:0 and never animate back.
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.5,
        delay: reduceMotion ? 0 : Math.min(index, 5) * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="fleet-card__photo">
        {imageError ? (
          <div className="fleet-card__fallback" aria-hidden="true">
            <span>{vehicleType.name}</span>
          </div>
        ) : (
          <Image
            src={image}
            alt={vehicleType.name}
            fill
            priority={index < 3}
            className="fleet-card__img"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        )}

        <span className="fleet-glass fleet-glass--start">
          {vehicleType.category}
          {level !== undefined && <PriceMeter level={level} className="price-meter--glass" />}
        </span>

        {unavailable ? (
          <span className="fleet-card__status">
            <span>{unavailableLabel}</span>
          </span>
        ) : (
          <span className="fleet-glass fleet-glass--end">
            <Check className="h-3 w-3" aria-hidden="true" />
            Free cancellation
          </span>
        )}
      </div>

      <div className="fleet-card__body">
        <Heading className="fleet-card__name">
          {/* The line is kept when there is no make, so every card's body starts at the same height. */}
          {make
            ? <span className="fleet-card__make">{make}</span>
            : <span className="fleet-card__make" aria-hidden="true">{'\u00a0'}</span>}
          <span className="fleet-card__model">{model}</span>
        </Heading>

        {description && <p className="fleet-card__desc">{description}</p>}

        <ul className="fleet-card__chips">
          <li>
            <Users aria-hidden="true" />
            <span className="numeric">{plural(vehicleType.capacity, 'passenger', 'passengers')}</span>
          </li>
          <li>
            <Briefcase aria-hidden="true" />
            <span className="numeric">{plural(vehicleType.luggageCapacity, 'bag', 'bags')}</span>
          </li>
          <li>
            <Clock aria-hidden="true" />
            60 min free waiting
          </li>
        </ul>

        {hasPricingNotes && tripPricing && (
          <ul className="fleet-card__notes">
            {tripPricing.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
            {tripPricing.extraHourPrice !== undefined && tripPricing.extraHourPrice > 0 && (
              <li>
                Extra hour <span className="numeric">{formatResultPrice(tripPricing.extraHourPrice, currentCurrency, exchangeRates)}</span>
              </li>
            )}
          </ul>
        )}

        <div className="fleet-card__foot">
          <div className="min-w-0">
            <p className="fleet-card__label">{tripPricing?.label ?? 'From'}</p>
            <p className="fleet-card__price numeric">
              {formatResultPrice(vehicleType.price, currentCurrency, exchangeRates)}
            </p>
            <p className="fleet-card__caption">{tripPricing?.caption ?? 'per vehicle'}</p>
          </div>

          {unavailable ? (
            <span className="fleet-pill fleet-pill--off">Unavailable</span>
          ) : (
            // The ::after overlay makes the whole card the target. People tap
            // the car, not the button; the button keeps its own focus ring.
            <Link
              href={selectionHref(vehicleType, searchParams)}
              className="fleet-pill fleet-pill--select"
              aria-label={`Select ${vehicleType.name}`}
            >
              Select
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  )
}
