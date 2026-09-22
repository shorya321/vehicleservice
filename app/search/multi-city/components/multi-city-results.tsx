'use client'

import Link from 'next/link'
import { format, parse } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useCurrency } from '@/lib/currency/context'
import type { VehicleTypeResult, VehicleTypesByCategory } from '../../results/actions'
import { VehicleTypeCategoryTabs } from '../../results/components/vehicle-type-category-tabs'
import { ResultsGuestPicker } from '../../results/components/results-guest-picker'
import { EmptyState } from '../../results/components/empty-state'
import { BookingStepsBand, type BookingStep } from '../../results/components/booking-steps-band'
import { formatResultPrice } from '../../results/components/format-result-price'
import type { ResultsSearchParams } from '../../results/components/results-search-params'

const MULTI_CITY_STEPS: BookingStep[] = [
  {
    index: '01',
    title: 'Choose your vehicle',
    body: 'One class for every journey of the trip. The price shown covers all of them.',
    foot: 'On this page',
  },
  {
    index: '02',
    title: 'Set each pickup time',
    body: 'Passenger details and a pickup time for each journey, then one payment for the trip.',
    foot: 'Each journey free to cancel up to 24 hours before',
  },
  {
    index: '03',
    title: 'Meet your chauffeur',
    body: '45 minutes of free waiting at every pickup, tracked airport arrivals included.',
    foot: 'Name board at the door',
  },
]

export interface MultiCityLegView {
  fromName: string
  toName: string
  date: string
}

interface MultiCityResultsProps {
  legs: MultiCityLegView[]
  vehicleTypes: VehicleTypeResult[]
  vehicleTypesByCategory: VehicleTypesByCategory[]
  minPrice: number | null
  searchParams: ResultsSearchParams
  routeMap?: React.ReactNode
}

const legDate = (date: string): string => format(parse(date, 'yyyy-MM-dd', new Date()), 'EEE · d MMM')

export function MultiCityResults({ legs, vehicleTypes, vehicleTypesByCategory, minPrice, searchParams, routeMap }: MultiCityResultsProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const prefersReducedMotion = useReducedMotion()

  if (vehicleTypes.length === 0) {
    return (
      <EmptyState
        searchParams={searchParams}
        title="No vehicle for this trip"
        body="No vehicle that seats your party covers every journey of this trip. Try fewer guests, or book the journeys separately."
      />
    )
  }

  return (
    <>
      <motion.section
        aria-label={`Multi-city trip, ${legs.length} journeys`}
        className="route-band editorial-section editorial-section--ground editorial-section--compact"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {routeMap}
        <div className="luxury-container relative z-10">
          <Link href="/" className="editorial-action">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            New search
          </Link>

          <div className="mt-8 max-w-4xl">
            <p className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />Your trip</p>
            <h1 className="editorial-section-title mt-5">{legs.length} journeys</h1>
            <ol className="mt-6 list-none space-y-3 p-0">
              {legs.map((leg, index) => (
                <li key={`${leg.fromName}-${leg.toName}-${index}`} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="numeric w-[5.5rem] flex-none text-[0.8125rem] text-[var(--text-muted)]">{legDate(leg.date)}</span>
                  <span className="text-[1.0625rem] text-[var(--text-primary)]">
                    {leg.fromName} <span className="text-[var(--text-muted)]">to</span> {leg.toName}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <dl className="trip-ledger mt-10">
            <div className="trip-ledger__item">
              <dt className="trip-ledger__label">Guests</dt>
              <dd className="trip-ledger__value">
                <ResultsGuestPicker
                  searchParams={searchParams}
                  className="inline-flex min-h-9 items-center gap-1.5 border-b border-dashed border-[rgba(var(--gold-rgb),0.45)] bg-transparent pb-0.5 text-[1.0625rem] text-[var(--text-primary)] transition-colors hover:border-[var(--gold-text)]"
                />
              </dd>
            </div>
            {minPrice !== null && (
              <div className="trip-ledger__item trip-ledger__item--price">
                <dt className="trip-ledger__label">Whole trip from</dt>
                <dd className="trip-ledger__value numeric">{formatResultPrice(minPrice, currentCurrency, exchangeRates)}</dd>
              </div>
            )}
          </dl>
        </div>
      </motion.section>

      <section className="editorial-section editorial-section--raised border-t border-[var(--graphite)]">
        <div className="luxury-container">
          <header className="max-w-2xl">
            <p className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />The fleet</p>
            <h2 className="editorial-section-title mt-5">One vehicle class for the whole trip.</h2>
            <p className="editorial-body mt-6">
              Every price covers all {legs.length} journeys: vehicle, chauffeur, fuel, tolls and parking.
            </p>
          </header>
          <div className="mt-12">
            <VehicleTypeCategoryTabs
              key={`${searchParams.passengers}-multi`}
              vehicleTypesByCategory={vehicleTypesByCategory}
              allVehicleTypes={vehicleTypes}
              searchParams={searchParams}
            />
          </div>
        </div>
      </section>

      <BookingStepsBand steps={MULTI_CITY_STEPS} />
    </>
  )
}
