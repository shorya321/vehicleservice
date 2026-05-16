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
      className="group flex h-full flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[4px] bg-[var(--charcoal)] border border-[var(--graphite)]">
        {imageError ? (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--charcoal)] to-[var(--black-warm)] flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">{vehicleType.category}</div>
              <div className="mt-2 text-xl font-medium text-[var(--text-primary)]">{vehicleType.name}</div>
            </div>
          </div>
        ) : (
          <Image
            src={vehicleTypeImage}
            alt={vehicleType.name}
            fill
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        )}
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto] items-baseline gap-x-4">
        <h3 className="font-display text-2xl leading-tight text-[var(--text-primary)]">
          {vehicleType.name}
        </h3>
        <span className="numeric text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--gold)]">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <p className="mt-1 text-[0.875rem] leading-snug text-[var(--text-muted)]">
        {models}
      </p>

      <dl className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-[var(--graphite)] pt-4 text-[0.875rem] text-[var(--text-secondary)]">
        <div className="flex items-baseline gap-2">
          <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Pax</dt>
          <dd className="numeric text-[var(--text-primary)]">{vehicleType.capacity}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Bags</dt>
          <dd className="numeric text-[var(--text-primary)]">{vehicleType.luggageCapacity}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Wait</dt>
          <dd className="numeric text-[var(--text-primary)]">15 min</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        <div>
          <div className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">From</div>
          <div className="numeric mt-1 text-2xl text-[var(--gold-text)]">
            {formatPrice(vehicleType.price, currentCurrency, exchangeRates)}
          </div>
          <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            per vehicle · free cancellation
          </p>
        </div>

        {unavailable ? (
          <span className="border border-[var(--graphite)] px-4 py-2 text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Sold out
          </span>
        ) : (
          <Link
            href={selectionUrl}
            className="btn btn-primary h-11 px-5 text-[0.75rem]"
            aria-label={`Select ${vehicleType.name}`}
          >
            Select
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </motion.article>
  )
}
