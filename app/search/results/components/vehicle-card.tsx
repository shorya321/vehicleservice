'use client'

import Image from 'next/image'
import Link from 'next/link'
import { SearchResultVehicle } from '../actions'
import {
  Users,
  Briefcase,
  Star,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { motion, useReducedMotion } from 'motion/react'

interface VehicleCardProps {
  vehicle: SearchResultVehicle
  routeId: string
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
  index?: number
}

export function VehicleCard({ vehicle, routeId, searchParams, index = 0 }: VehicleCardProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const reduceMotion = useReducedMotion()
  const vehicleImage = vehicle.images[0] || '/placeholder-vehicle.jpg'

  const bookingUrl = `/booking/vehicle/${vehicle.id}?${new URLSearchParams({
    route: routeId,
    ...searchParams
  }).toString()}`

  return (
    <motion.article
      aria-label={vehicle.name}
      className="vehicle-card-surface group overflow-hidden rounded-[8px] border border-[var(--graphite)] bg-[var(--black-warm)] dark:bg-[var(--charcoal)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[rgba(var(--gold-rgb),0.25)] hover:shadow-[0_12px_24px_-6px_rgba(var(--gold-rgb),0.15),0_4px_10px_-4px_rgba(var(--gold-rgb),0.1)]"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="grid md:grid-cols-[300px,1fr] gap-0">
        <div className="relative h-48 md:h-full overflow-hidden bg-[var(--black-warm)] dark:bg-[var(--charcoal)]">
          <Image
            src={vehicleImage}
            alt={vehicle.name}
            fill
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 300px"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--black-warm)] dark:from-[var(--charcoal)] to-transparent" aria-hidden="true" />
          <span className={`absolute top-4 left-4 rounded-[4px] px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.16em] ${vehicle.category === 'Premium' ? 'bg-[var(--gold)] text-[var(--black-void)]' : 'bg-[rgba(var(--gold-rgb),0.08)] text-[var(--text-secondary)] border border-[var(--graphite)]'}`}>
            {vehicle.category}
          </span>
        </div>

        <div className="flex flex-col gap-5 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h3 className="font-display text-[1.375rem] font-medium leading-tight tracking-[-0.01em] text-[var(--text-primary)]">
                {vehicle.name}
              </h3>
              <p className="mt-1.5 text-[0.8125rem] text-[var(--text-muted)]">
                Provided by <span className="text-[var(--gold-text)]">{vehicle.vendorName}</span>
              </p>
            </div>

            <div className="md:text-right">
              {vehicle.originalPrice && (
                <div className="numeric text-[0.8125rem] text-[var(--text-muted)] line-through">
                  {formatPrice(vehicle.originalPrice, currentCurrency, exchangeRates)}
                </div>
              )}
              <div className="numeric text-[1.75rem] font-medium text-[var(--gold-text)]">
                {formatPrice(vehicle.price, currentCurrency, exchangeRates)}
              </div>
              <div className="mt-1 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                per vehicle
              </div>
            </div>
          </div>

          <dl className="flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--graphite)] pt-4">
            <div className="flex items-baseline gap-2">
              <Users className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
              <dt className="sr-only">Passengers</dt>
              <dd className="text-[0.8125rem] text-[var(--text-secondary)]">Up to {vehicle.capacity}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <Briefcase className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
              <dt className="sr-only">Luggage</dt>
              <dd className="text-[0.8125rem] text-[var(--text-secondary)]">{vehicle.luggageCapacity} suitcases</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <Clock className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
              <dt className="sr-only">Duration</dt>
              <dd className="text-[0.8125rem] text-[var(--text-secondary)]">{vehicle.duration}</dd>
            </div>
            {vehicle.vendorRating > 0 && (
              <div className="flex items-baseline gap-2">
                <Star className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                <dt className="sr-only">Rating</dt>
                <dd className="numeric text-[0.8125rem] text-[var(--text-secondary)]">{vehicle.vendorRating.toFixed(1)}</dd>
              </div>
            )}
          </dl>

          {vehicle.features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {vehicle.features.slice(0, 4).map(feature => (
                <span
                  key={feature}
                  className="rounded-[4px] border border-[var(--graphite)] bg-[rgba(var(--gold-rgb),0.05)] px-2.5 py-1 text-[0.6875rem] text-[var(--text-secondary)]"
                >
                  {feature}
                </span>
              ))}
              {vehicle.features.length > 4 && (
                <span className="rounded-[4px] border border-[rgba(var(--gold-rgb),0.15)] bg-[rgba(var(--gold-rgb),0.1)] px-2.5 py-1 text-[0.6875rem] text-[var(--gold-text)]">
                  +{vehicle.features.length - 4} more
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-6 text-[0.8125rem]">
            {vehicle.instantConfirmation && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                <span className="text-[var(--text-secondary)]">Instant confirmation</span>
              </div>
            )}
            <span className="text-[var(--text-muted)]">{vehicle.cancellationPolicy}</span>
          </div>

          <div className="flex justify-end pt-2">
            <Link
              href={bookingUrl}
              className="inline-flex items-center gap-2 rounded-[4px] bg-[var(--gold)] px-6 py-3.5 text-[0.75rem] font-medium uppercase tracking-[0.08em] text-[var(--black-void)] shadow-[0_10px_30px_-10px_rgba(var(--gold-rgb),0.4)] transition-all duration-300 hover:bg-[var(--gold-deep)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--charcoal)]"
              aria-label={`Select ${vehicle.name}`}
            >
              Select Vehicle
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
