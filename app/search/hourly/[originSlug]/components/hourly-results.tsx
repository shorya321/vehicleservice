'use client'

import Link from 'next/link'
import { ArrowLeft, Clock, MapPin } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useCurrency } from '@/lib/currency/context'
import { HOURLY_PACKAGES, type HourlyPackage } from '@/lib/trips/types'
import { HOURLY_PACKAGE_LABELS } from '@/lib/trips/constants'
import { buildHourlySearchUrl } from '@/lib/utils/url-builder'
import type { VehicleTypeResult, VehicleTypesByCategory } from '../../../results/actions'
import { VehicleTypeCategoryTabs } from '../../../results/components/vehicle-type-category-tabs'
import { ResultsDatePicker } from '../../../results/components/results-date-picker'
import { ResultsGuestPicker } from '../../../results/components/results-guest-picker'
import { EmptyState } from '../../../results/components/empty-state'
import { BookingStepsBand, type BookingStep } from '../../../results/components/booking-steps-band'
import { formatResultPrice } from '../../../results/components/format-result-price'
import { toCount, type ResultsSearchParams } from '../../../results/components/results-search-params'

const HOURLY_STEPS: BookingStep[] = [
  {
    index: '01',
    title: 'Choose your vehicle',
    body: 'Every class offered by the hour, with seats and bags. The package price covers the hours and kilometres shown.',
    foot: 'On this page',
  },
  {
    index: '02',
    title: 'Confirm and pay',
    body: 'Start time and passenger details, then payment. Tell us your plans in the notes and your chauffeur will follow them.',
    foot: 'Free cancellation for 24 hours',
  },
  {
    index: '03',
    title: 'Your chauffeur, as directed',
    body: 'Collected from your pickup, then wherever the day takes you. Extra hours are charged at the rate shown.',
    foot: 'Name board at the door',
  },
]

interface HourlyResultsProps {
  originName: string
  originSlug: string
  hourlyPackage: HourlyPackage
  vehicleTypes: VehicleTypeResult[]
  vehicleTypesByCategory: VehicleTypesByCategory[]
  minPrice: number | null
  hours: number | null
  searchParams: ResultsSearchParams
  routeMap?: React.ReactNode
}

const LEDGER_CONTROL =
  'inline-flex min-h-9 items-center gap-1.5 border-b border-dashed border-[rgba(var(--gold-rgb),0.45)] bg-transparent pb-0.5 text-[1.0625rem] text-[var(--text-primary)] transition-colors hover:border-[var(--gold-text)]'

export function HourlyResults({
  originName,
  originSlug,
  hourlyPackage,
  vehicleTypes,
  vehicleTypesByCategory,
  minPrice,
  hours,
  searchParams,
  routeMap,
}: HourlyResultsProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const prefersReducedMotion = useReducedMotion()

  const packageHref = (pkg: HourlyPackage): string =>
    buildHourlySearchUrl(originSlug, {
      date: searchParams.date ?? '',
      passengers: searchParams.passengers || '1',
      adults: toCount(searchParams.adults),
      children: toCount(searchParams.children),
      infants: toCount(searchParams.infants),
      hourlyPackage: pkg,
    })

  if (vehicleTypes.length === 0) {
    return (
      <EmptyState
        originName={originName}
        searchParams={searchParams}
        title={`No ${HOURLY_PACKAGE_LABELS[hourlyPackage].toLowerCase()} hire available`}
        body="No vehicle that seats your party is offered by the hour yet. Try the other package, a smaller party, or book a transfer instead."
      />
    )
  }

  return (
    <>
      <motion.section
        aria-label={`Hourly hire from ${originName}`}
        className="route-band editorial-section editorial-section--ground editorial-section--compact"
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.5,
          delay: prefersReducedMotion ? 0 : 0.1,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {routeMap}

        <div className="luxury-container relative z-10">
          <Link href="/" className="editorial-action">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            New search
          </Link>

          <div className="mt-8 max-w-4xl">
            <p className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />Hourly hire</p>
            <h1 className="route-heading editorial-section-title mt-5">
              <span className="route-heading__place">{originName}</span>
            </h1>
            <p className="mt-4 inline-flex items-center gap-1.5 text-[0.8125rem] text-[var(--text-secondary)]">
              <MapPin className="h-3.5 w-3.5 flex-none text-[var(--gold-text)]" aria-hidden="true" />
              A chauffeur and vehicle for the day, as directed
            </p>
          </div>

          <dl className="trip-ledger mt-10">
            <div className="trip-ledger__item">
              <dt className="trip-ledger__label">Date</dt>
              <dd className="trip-ledger__value">
                <ResultsDatePicker searchParams={searchParams} />
              </dd>
            </div>

            <div className="trip-ledger__item">
              <dt className="trip-ledger__label">Package</dt>
              <dd className="trip-ledger__value">
                <span className="inline-flex gap-3" role="group" aria-label="Hourly package">
                  {HOURLY_PACKAGES.map((pkg) => (
                    <Link
                      key={pkg}
                      href={packageHref(pkg)}
                      aria-current={pkg === hourlyPackage ? 'page' : undefined}
                      className={
                        pkg === hourlyPackage
                          ? `${LEDGER_CONTROL} text-[var(--gold-text)]`
                          : `${LEDGER_CONTROL} border-transparent text-[var(--text-secondary)]`
                      }
                    >
                      {HOURLY_PACKAGE_LABELS[pkg]}
                    </Link>
                  ))}
                </span>
              </dd>
            </div>

            <div className="trip-ledger__item">
              <dt className="trip-ledger__label">Guests</dt>
              <dd className="trip-ledger__value">
                <ResultsGuestPicker
                  searchParams={searchParams}
                  className="inline-flex min-h-9 items-center gap-1.5 border-b border-dashed border-[rgba(var(--gold-rgb),0.45)] bg-transparent pb-0.5 text-[1.0625rem] text-[var(--text-primary)] transition-colors hover:border-[var(--gold-text)]"
                />
              </dd>
            </div>

            {hours !== null && (
              <div className="trip-ledger__item">
                <dt className="trip-ledger__label">Duration</dt>
                <dd className="trip-ledger__value">
                  <Clock className="h-3.5 w-3.5 flex-none text-[var(--gold-text)]" aria-hidden="true" />
                  <span className="numeric">{hours} h</span>
                </dd>
              </div>
            )}

            {minPrice !== null && (
              <div className="trip-ledger__item trip-ledger__item--price">
                <dt className="trip-ledger__label">From</dt>
                <dd className="trip-ledger__value numeric">
                  {formatResultPrice(minPrice, currentCurrency, exchangeRates)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </motion.section>

      <section className="editorial-section editorial-section--raised border-t border-[var(--graphite)]">
        <div className="luxury-container">
          <motion.header
            className="max-w-2xl"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, amount: 0.4 }}
          >
            <p className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />The fleet</p>
            <h2 className="editorial-section-title mt-5">Every vehicle offered by the hour.</h2>
            <p className="editorial-body mt-6">
              The package price covers the vehicle, chauffeur and fuel for the hours and kilometres
              shown. Extra hours are billed at the rate on each card.
            </p>
          </motion.header>

          <div className="mt-12">
            <VehicleTypeCategoryTabs
              key={`${searchParams.passengers}-${hourlyPackage}`}
              vehicleTypesByCategory={vehicleTypesByCategory}
              allVehicleTypes={vehicleTypes}
              searchParams={searchParams}
            />
          </div>
        </div>
      </section>

      <BookingStepsBand steps={HOURLY_STEPS} />
    </>
  )
}
