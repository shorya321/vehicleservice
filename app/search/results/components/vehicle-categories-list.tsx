'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Car, Users, ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'
import { CategoryResult } from '../actions'

interface VehicleCategoriesListProps {
  categories: CategoryResult[]
  searchParams: {
    from: string
    date: string
    passengers: string
  }
}

export function VehicleCategoriesList({ categories, searchParams }: VehicleCategoriesListProps) {
  const { currentCurrency, exchangeRates } = useCurrency()

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <Car className="mx-auto h-16 w-16 text-[var(--text-muted)]" strokeWidth={1.5} aria-hidden="true" />
        <div className="editorial-eyebrow mt-6">No vehicles</div>
        <h3 className="editorial-section-title mt-5">
          No vehicles available
        </h3>
        <p className="mt-5 text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
          Please try searching for a different location or date. Routes often have more availability on weekdays.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="editorial-eyebrow">Vehicle categories</div>
        <h2 className="editorial-section-title mt-3">Available Vehicle Categories</h2>
        <p className="mt-3 text-[0.875rem] text-[var(--text-secondary)]">
          No direct routes found. Browse vehicles by category
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            searchParams={searchParams}
            currentCurrency={currentCurrency}
            exchangeRates={exchangeRates}
          />
        ))}
      </div>
    </div>
  )
}

interface CategoryCardProps {
  category: CategoryResult
  searchParams: {
    from: string
    date: string
    passengers: string
  }
  currentCurrency: string
  exchangeRates: Record<string, number>
}

function CategoryCard({ category, searchParams, currentCurrency, exchangeRates }: CategoryCardProps) {
  const [imageError, setImageError] = useState(false)

  const categoryLink = `/vehicles?${new URLSearchParams({
    ...searchParams,
    category: category.slug
  }).toString()}`

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-[8px] border border-[rgba(var(--gold-rgb),0.15)] bg-[var(--charcoal)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[rgba(var(--gold-rgb),0.25)] hover:shadow-[0_12px_24px_-6px_rgba(var(--gold-rgb),0.15),0_4px_10px_-4px_rgba(var(--gold-rgb),0.1)]"
      aria-label={category.name}
    >
      {/* Category image */}
      {category.imageUrl && !imageError ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[8px] bg-[var(--charcoal)]">
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        category.imageUrl && (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[8px] bg-[var(--charcoal)]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <Car className="mx-auto h-10 w-10 text-[var(--text-muted)]" strokeWidth={1.5} aria-hidden="true" />
                <div className="mt-3 font-display text-lg font-medium text-[var(--text-primary)]">{category.name}</div>
              </div>
            </div>
          </div>
        )
      )}

      <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
        {/* Category header */}
        <h3 className="font-display text-[1.25rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--text-primary)]">
          {category.name}
        </h3>
        {category.description && (
          <p className="mt-2 line-clamp-2 text-[0.8125rem] leading-snug text-[var(--text-muted)]">
            {category.description}
          </p>
        )}

        {/* Vehicle count and seats */}
        <div className="mt-4 flex items-center gap-5 text-[0.8125rem] text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <Car className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="numeric">{category.vehicleCount}</span>
            <span>vehicles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="numeric">{searchParams.passengers}+</span>
            <span>seats</span>
          </div>
        </div>

        {/* Pricing and CTA */}
        <div className="mt-auto border-t border-[var(--graphite)] pt-5 mt-5">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <div className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Starting from
              </div>
              <div className="numeric mt-1 text-[1.5rem] font-semibold text-[var(--gold-text)]">
                {formatPrice(category.minPrice, currentCurrency, exchangeRates)}
              </div>
              <div className="mt-0.5 text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                per day
              </div>
            </div>
          </div>

          <Link
            href={categoryLink}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[4px] bg-[linear-gradient(180deg,var(--gold)_0%,var(--gold-medium)_100%)] px-5 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[var(--onyx)] shadow-[inset_0_0_0_1px_rgba(var(--gold-rgb),0.3),0_10px_24px_-10px_rgba(var(--gold-rgb),0.45)] transition-all duration-300 hover:bg-[linear-gradient(180deg,var(--gold-medium)_0%,var(--gold-deep)_100%)] hover:-translate-y-px hover:shadow-[inset_0_0_0_1px_rgba(var(--gold-rgb),0.3),0_14px_28px_-10px_rgba(var(--gold-rgb),0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
            aria-label={`View ${category.name} vehicles`}
          >
            View {category.name} Vehicles
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}
