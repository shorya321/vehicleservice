'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { VehicleTypeResult, VehicleTypesByCategory } from '../actions'
import { VehicleTypeGridCard } from './vehicle-type-grid-card'
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from 'motion/react'
import { Pagination } from './pagination'

interface VehicleTypeCategoryTabsProps {
  vehicleTypesByCategory: VehicleTypesByCategory[]
  allVehicleTypes: VehicleTypeResult[]
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
    originSlug?: string
    destSlug?: string
  }
}

type SortOption = 'price-asc' | 'price-desc' | 'capacity' | 'name'

const ITEMS_PER_PAGE = 6

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
    <div className="w-full space-y-10">
      <LayoutGroup id="vehicleTypeTabs">
        <div
          role="tablist"
          aria-label="Vehicle categories"
          className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-[var(--graphite)] pb-1"
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
                className={`relative -mb-px rounded px-3 py-2 text-[0.75rem] font-medium uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)] ${selected ? "text-[var(--gold-text)] bg-[rgba(var(--gold-rgb),0.12)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
              >
                <span>{tab.name}</span>
                <span className={`ml-2 numeric text-[0.6875rem] ${selected ? 'text-[var(--gold-text)]' : 'text-[var(--text-muted)]'}`}>
                  {String(tab.count).padStart(2, '0')}
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <span className="numeric text-[1.5rem] font-semibold text-[var(--gold-text)]">{sortedVehicles.length}</span>
          <span className="uppercase tracking-[0.16em] text-[0.6875rem] text-[var(--text-muted)]">
            vehicles available
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="vehicle-sort" className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Sort
          </label>
          <select
            id="vehicle-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-11 min-w-[10rem] cursor-pointer rounded-[4px] border border-[var(--graphite)] bg-[var(--charcoal)] px-4 text-[0.875rem] text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:border-[var(--gold)] focus-visible:ring-2 focus-visible:ring-[var(--gold)]/25 [&>option]:text-[#1a1917] [&>option]:bg-[#f8f6f3]"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
              <option key={opt} value={opt}>{SORT_LABELS[opt]}</option>
            ))}
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
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
