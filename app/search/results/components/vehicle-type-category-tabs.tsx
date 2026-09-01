'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { VehicleTypeResult, VehicleTypesByCategory } from '../actions'
import { VehicleTypeGridCard } from './vehicle-type-grid-card'
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'motion/react'
import { Pagination } from './pagination'
import { SortSelect } from './sort-select'

interface VehicleTypeCategoryTabsProps {
  vehicleTypesByCategory: VehicleTypesByCategory[]
  allVehicleTypes: VehicleTypeResult[]
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
}

type SortOption = 'price-asc' | 'price-desc' | 'capacity' | 'name'

const ITEMS_PER_PAGE = 6

const SORT_OPTIONS = ['price-asc', 'price-desc', 'capacity', 'name'] as const satisfies readonly SortOption[]

const SORT_LABELS: Record<SortOption, string> = {
  'price-asc': 'Price · low to high',
  'price-desc': 'Price · high to low',
  'capacity': 'Capacity',
  'name': 'Name',
}

export function VehicleTypeCategoryTabs({
  vehicleTypesByCategory,
  allVehicleTypes,
  searchParams,
}: VehicleTypeCategoryTabsProps) {
  const reduceMotion = useReducedMotion()
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('price-asc')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory, sortBy])

  const currentVehicles = useMemo(() => {
    if (activeCategory === 'all') return allVehicleTypes
    const category = vehicleTypesByCategory.find(c => c.categoryId === activeCategory)
    return category?.vehicleTypes || []
  }, [activeCategory, allVehicleTypes, vehicleTypesByCategory])

  const sortedVehicles = useMemo(() => {
    const vehicles = [...currentVehicles]
    switch (sortBy) {
      case 'price-asc': vehicles.sort((a, b) => a.price - b.price); break
      case 'price-desc': vehicles.sort((a, b) => b.price - a.price); break
      case 'capacity': vehicles.sort((a, b) => b.capacity - a.capacity); break
      case 'name': vehicles.sort((a, b) => a.name.localeCompare(b.name)); break
    }
    // Available vehicles first, sold-out last
    vehicles.sort((a, b) => {
      const aOut = a.availableVehicles === 0 ? 1 : 0
      const bOut = b.availableVehicles === 0 ? 1 : 0
      return aOut - bOut
    })
    return vehicles
  }, [currentVehicles, sortBy])

  const totalPages = Math.ceil(sortedVehicles.length / ITEMS_PER_PAGE)
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedVehicles.slice(start, start + ITEMS_PER_PAGE)
  }, [sortedVehicles, currentPage])

  const tabs = [
    { id: 'all', name: 'All', count: allVehicleTypes.length },
    ...vehicleTypesByCategory.map((c) => ({
      id: c.categoryId,
      name: c.categoryName,
      count: c.vehicleTypes.length,
    })),
  ]

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex !== null) {
      e.preventDefault()
      setActiveCategory(tabs[nextIndex].id)
      tabRefs.current[nextIndex]?.focus()
    }
  }, [tabs])

  return (
    <div className="w-full">
      <LayoutGroup id="vehicleTypeTabs">
        {/* No horizontal padding on the tabs: the first one now starts on the
            same left rail as the heading, the count and the card grid. Six
            categories scroll rather than wrapping into a block that pushes the
            first vehicle below the fold on a phone. */}
        <div
          role="tablist"
          aria-label="Vehicle categories"
          className="scrollbar-hide flex items-baseline gap-x-7 overflow-x-auto border-b border-[var(--graphite)]"
        >
          {tabs.map((tab, tabIndex) => {
            const selected = activeCategory === tab.id
            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tabIndex] = el }}
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveCategory(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, tabIndex)}
                className={`relative whitespace-nowrap pb-2.5 text-[0.75rem] font-medium uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)] ${selected ? "text-[var(--gold-text)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
              >
                <span>{tab.name}</span>
                <span className={`ml-2 numeric text-[0.6875rem] ${selected ? 'text-[var(--gold-text)]' : 'text-[var(--text-muted)]'}`}>
                  {tab.count}
                </span>
                {selected && (
                  <motion.span
                    layoutId="vehicleTypeTabIndicator"
                    aria-hidden
                    className="absolute -bottom-px left-0 right-0 h-[2px] bg-[var(--gold)]"
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </LayoutGroup>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {/* Figure over caption, matching the hero stats. Set inline at one size
            the number never read as a figure. */}
        <p className="flex flex-col gap-1.5">
          <span className="numeric text-[clamp(1.5rem,2.4vw,1.875rem)] font-medium leading-none tracking-[-0.02em] text-[var(--gold-text)]">
            {sortedVehicles.length}
          </span>
          <span className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Vehicles available
          </span>
        </p>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Sort
          </span>
          <SortSelect<SortOption>
            value={sortBy}
            options={SORT_OPTIONS}
            labels={SORT_LABELS}
            onChange={setSortBy}
            label="Sort"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: reduceMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: reduceMotion ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          key={`${activeCategory}-${sortBy}-${currentPage}`}
        >
          {paginatedVehicles.map((vehicleType, index) => (
            <VehicleTypeGridCard
              key={vehicleType.id}
              vehicleType={vehicleType}
              searchParams={searchParams}
              index={index}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedVehicles.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
