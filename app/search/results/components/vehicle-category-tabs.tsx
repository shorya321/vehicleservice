'use client'

import { useState, useMemo, useEffect } from 'react'
import { SearchResultVehicle, VehiclesByCategory } from '../actions'
import { VehicleCard } from './vehicle-card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'motion/react'
import { formatPrice } from '@/lib/currency/format'
import { useCurrency } from '@/lib/currency/context'

interface VehicleCategoryTabsProps {
  vehiclesByCategory: VehiclesByCategory[]
  allVehicles: SearchResultVehicle[]
  routeId: string
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
}

const ITEMS_PER_PAGE = 6

export function VehicleCategoryTabs({
  vehiclesByCategory,
  allVehicles,
  routeId,
  searchParams,
}: VehicleCategoryTabsProps) {
  const { currentCurrency, exchangeRates } = useCurrency()
  const reduceMotion = useReducedMotion()
  const [activeCategory, setActiveCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory])

  const allMinPrice = allVehicles.length > 0
    ? Math.min(...allVehicles.map(v => v.price))
    : 0

  const currentVehicles = useMemo(() => {
    if (activeCategory === 'all') return allVehicles
    const category = vehiclesByCategory.find(c => c.categoryId === activeCategory)
    return category?.vehicles || []
  }, [activeCategory, allVehicles, vehiclesByCategory])

  const totalPages = Math.ceil(currentVehicles.length / ITEMS_PER_PAGE)
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return currentVehicles.slice(start, start + ITEMS_PER_PAGE)
  }, [currentVehicles, currentPage])

  const tabs = [
    { id: 'all', name: 'All', count: allVehicles.length, minPrice: allMinPrice },
    ...vehiclesByCategory.map((c) => ({
      id: c.categoryId,
      name: c.categoryName,
      count: c.vehicles.length,
      minPrice: c.minPrice,
    })),
  ]

  return (
    <div className="w-full space-y-8">
      <LayoutGroup id="vehicleCategoryTabs">
        <div
          role="tablist"
          aria-label="Vehicle categories"
          className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-[var(--graphite)] pb-1"
        >
          {tabs.map((tab) => {
            const selected = activeCategory === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveCategory(tab.id)}
                className={`relative -mb-px rounded px-3 py-2 text-[0.75rem] font-medium uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)] ${selected ? "text-[var(--text-primary)] bg-[rgba(var(--gold-rgb),0.08)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
              >
                <span>{tab.name}</span>
                <span className="ml-2 numeric text-[0.6875rem] text-[var(--text-muted)]">
                  {String(tab.count).padStart(2, '0')}
                </span>
                {tab.minPrice > 0 && (
                  <span className="ml-2 numeric text-[0.6875rem] text-[var(--text-muted)]">
                    from {formatPrice(tab.minPrice, currentCurrency, exchangeRates)}
                  </span>
                )}
                {selected && (
                  <motion.span
                    layoutId="vehicleCatTabIndicator"
                    aria-hidden
                    className="absolute -bottom-px left-0 right-0 h-px bg-[var(--gold)]"
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </LayoutGroup>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.875rem] text-[var(--text-secondary)]">
          <span className="numeric text-[var(--text-primary)]">{currentVehicles.length}</span>{" "}
          <span className="uppercase tracking-[0.16em] text-[0.6875rem] text-[var(--text-muted)]">
            vehicles available
          </span>
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          className="grid gap-6"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          key={`${activeCategory}-${currentPage}`}
        >
          {paginatedVehicles.map((vehicle, index) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              routeId={routeId}
              searchParams={searchParams}
              index={index}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="flex flex-col items-center gap-4 border-t border-[var(--graphite)] pt-8 sm:flex-row sm:justify-between"
        >
          <p className="text-[0.75rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <span className="numeric text-[var(--text-secondary)]">
              {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, currentVehicles.length)}
            </span>{" "}
            of{" "}
            <span className="numeric text-[var(--text-secondary)]">{currentVehicles.length}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="inline-flex h-10 items-center gap-1 rounded-[4px] border border-[var(--graphite)] px-3 text-[0.75rem] uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-[color,border-color,transform] duration-200 hover:border-[var(--gold)] hover:text-[var(--gold)] motion-safe:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Prev
            </button>

            <div className="flex items-center">
              {(() => {
                const pages: (number | '...')[] = [1]
                if (currentPage > 3) pages.push('...')
                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                  pages.push(i)
                }
                if (currentPage < totalPages - 2) pages.push('...')
                if (totalPages > 1) pages.push(totalPages)
                return pages.map((page, idx) => {
                  if (page === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="inline-flex h-10 min-w-6 items-center justify-center text-[var(--text-muted)]">
                        <span className="numeric">&hellip;</span>
                      </span>
                    )
                  }
                  const active = page === currentPage
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      aria-label={`Page ${page}`}
                      aria-current={active ? 'page' : undefined}
                      className={`inline-flex h-10 min-w-10 items-center justify-center px-2 text-[0.875rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)] ${active ? "numeric text-[var(--gold)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                    >
                      <span className="numeric">{page}</span>
                    </button>
                  )
                })
              })()}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="inline-flex h-10 items-center gap-1 rounded-[4px] border border-[var(--graphite)] px-3 text-[0.75rem] uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-[color,border-color,transform] duration-200 hover:border-[var(--gold)] hover:text-[var(--gold)] motion-safe:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}
