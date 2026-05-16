'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { VehicleTypeResult } from '../actions'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { buildCheckoutUrl } from '@/lib/utils/url-builder'

interface VehicleTypeGridCardProps {
  vehicleType: VehicleTypeResult
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
    originSlug?: string
    destSlug?: string
  }
  index?: number
}

const vehicleModels: Record<string, string> = {
  'economy-sedan': 'Toyota Etios, Maruti Swift',
  'sedan': 'Honda City, Maruti Ciaz',
  'luxury-sedan': 'Mercedes E-Class, BMW 5 Series',
  'suv': 'Toyota Innova, Mahindra XUV',
  'luxury-suv': 'Audi Q7, BMW X5',
  'minivan': 'Toyota Hiace, Tempo Traveller',
  'van': 'Force Traveller',
  'minibus': '20-Seater Bus',
  'bus': '35-Seater Bus, 45-Seater Bus',
}

export function VehicleTypeGridCard({ vehicleType, searchParams, index = 0 }: VehicleTypeGridCardProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const reduceMotion = useReducedMotion()
  const [imageError, setImageError] = useState(false)
  const vehicleTypeImage = vehicleType.image || `/images/vehicle-types/${vehicleType.slug}.jpg`
  const models = vehicleModels[vehicleType.slug] || vehicleType.name

  const selectionUrl = searchParams.originSlug && searchParams.destSlug
    ? buildCheckoutUrl(searchParams.originSlug, searchParams.destSlug, vehicleType.slug, {
        date: searchParams.date || '',
        time: '10:00',
        passengers: searchParams.passengers || '1',
        luggage: '0',
      })
    : `/checkout?${new URLSearchParams({
        vehicleType: vehicleType.id,
        ...searchParams,
      }).toString()}`

  const unavailable = vehicleType.availableVehicles === 0

  return (
    <motion.article
      aria-label={unavailable ? `${vehicleType.name} — sold out` : vehicleType.name}
      className={`vehicle-card-surface group flex h-full flex-col rounded-[8px] border border-[var(--graphite)] bg-[var(--black-warm)] dark:bg-[var(--charcoal)] p-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${unavailable ? 'opacity-50' : 'hover:-translate-y-1 hover:border-[rgba(var(--gold-rgb),0.25)] hover:shadow-[0_12px_24px_-6px_rgba(var(--gold-rgb),0.15),0_4px_10px_-4px_rgba(var(--gold-rgb),0.1)]'}`}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[8px] bg-[var(--black-warm)]">
        {imageError ? (
          <div className="absolute inset-0 bg-[var(--black-warm)] dark:bg-[var(--charcoal)] flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">{vehicleType.category}</div>
              <div className="mt-2 font-display text-xl font-medium text-[var(--text-primary)]">{vehicleType.name}</div>
            </div>
          </div>
        ) : (
          <>
            <Image
              src={vehicleTypeImage}
              alt={vehicleType.name}
              fill
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--black-warm)] via-[var(--black-warm)]/60 dark:from-[var(--charcoal)] dark:via-[var(--charcoal)]/60 to-transparent" aria-hidden="true" />
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
        <h3 className="font-display text-[1.5rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--text-primary)]">
          {vehicleType.name}
        </h3>

        <p className="mt-1.5 line-clamp-1 text-[0.8125rem] leading-snug text-[var(--text-muted)]">
          {models}
        </p>

        <p className="mt-2 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Free cancellation
        </p>

        <dl className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-[var(--graphite)] pt-4">
          <div className="flex items-baseline gap-2">
            <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">Passengers</dt>
            <dd className="numeric text-[1rem] font-semibold text-[var(--text-primary)]">{vehicleType.capacity}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">Luggage</dt>
            <dd className="numeric text-[1rem] font-semibold text-[var(--text-primary)]">{vehicleType.luggageCapacity}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div>
            <div className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">From</div>
            <div className="numeric mt-1 text-[2rem] font-semibold text-[var(--gold-text)]">
              {formatPrice(vehicleType.price, currentCurrency, exchangeRates)}
            </div>
            <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              per vehicle · 15 min wait
            </p>
          </div>

          {unavailable ? (
            <span className="rounded-[4px] border border-[var(--graphite)] px-4 py-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Sold out
            </span>
          ) : (
            <Link
              href={selectionUrl}
              className="inline-flex items-center gap-2 rounded-[4px] bg-[linear-gradient(180deg,var(--gold)_0%,var(--gold-medium)_100%)] px-5 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[#f8f6f3] shadow-[inset_0_0_0_1px_rgba(var(--gold-rgb),0.3),0_10px_24px_-10px_rgba(var(--gold-rgb),0.45)] transition-all duration-300 hover:bg-[linear-gradient(180deg,var(--gold-medium)_0%,var(--gold-deep)_100%)] hover:-translate-y-px hover:shadow-[inset_0_0_0_1px_rgba(var(--gold-rgb),0.3),0_14px_28px_-10px_rgba(var(--gold-rgb),0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--charcoal)]"
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
