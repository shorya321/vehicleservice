"use client"
import { useState, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import Image from "next/image"
import { VehicleClassCategory } from "@/app/actions"

interface VehicleClassesClientProps {
  categories: VehicleClassCategory[]
}

function SectionHeader() {
  return (
    <header className="max-w-2xl">
      <div className="editorial-eyebrow">The fleet</div>
      <h2 id="fleet-heading" className="editorial-section-title--promoted mt-5">
        A small fleet, kept in order.
      </h2>
      <p className="editorial-body mt-6">
        Mercedes, BMW, and Cadillac on rotating annual leases. Choose by passenger count, luggage capacity, and the kind of arrival you want to make.
      </p>
    </header>
  )
}

export function VehicleClassesClient({ categories }: VehicleClassesClientProps) {
  const reduceMotion = useReducedMotion()
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.categoryId || "")
  const tabsRef = useRef<Map<string, HTMLButtonElement>>(new Map())

  const handleTabKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        newIndex = (currentIndex + 1) % categories.length
        break
      case 'ArrowLeft':
        e.preventDefault()
        newIndex = (currentIndex - 1 + categories.length) % categories.length
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = categories.length - 1
        break
      default:
        return
    }

    const newCategory = categories[newIndex]
    setActiveTab(newCategory.categoryId)
    const newTabButton = tabsRef.current.get(newCategory.categoryId)
    newTabButton?.focus()
  }

  if (categories.length === 0) {
    return (
      <section
        aria-labelledby="fleet-heading"
        className="editorial-section editorial-section--raised editorial-section--spacious"
        id="fleet"
      >
        <div className="luxury-container">
          <SectionHeader />
          <p className="mt-12 text-[var(--text-muted)]">No vehicle classes available at the moment.</p>
        </div>
      </section>
    )
  }

  const activeCategory = categories.find(cat => cat.categoryId === activeTab) || categories[0]

  return (
    <section
      aria-labelledby="fleet-heading"
      className="editorial-section editorial-section--raised editorial-section--spacious"
      id="fleet"
    >
      <div className="luxury-container">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <SectionHeader />
          <div
            role="tablist"
            aria-label="Vehicle categories"
            className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--graphite)] pt-4 md:border-t-0 md:pt-0"
          >
            {categories.map((category, index) => {
              const selected = activeTab === category.categoryId
              return (
                <button
                  key={category.categoryId}
                  ref={(el) => {
                    if (el) tabsRef.current.set(category.categoryId, el)
                  }}
                  onClick={() => setActiveTab(category.categoryId)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`panel-${category.categoryId}`}
                  id={`tab-${category.categoryId}`}
                  tabIndex={selected ? 0 : -1}
                  className={`relative py-1 px-3 rounded text-[0.75rem] font-medium uppercase tracking-[0.16em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)] ${selected ? "text-[var(--text-primary)] bg-[rgba(var(--gold-rgb),0.08)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
                >
                  {category.categoryName}
                  {selected && (
                    <span aria-hidden className="absolute -bottom-1 left-0 right-0 h-px bg-[var(--gold)]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory.categoryId}
            role="tabpanel"
            id={`panel-${activeCategory.categoryId}`}
            aria-labelledby={`tab-${activeCategory.categoryId}`}
            className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeCategory.vehicleTypes.map((vehicle, index) => {
              const isHero = index === 0 && activeCategory.vehicleTypes.length >= 3
              return (
              <motion.figure
                key={vehicle.id}
                className={`group ${isHero ? 'md:col-span-2' : ''}`}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={`relative overflow-hidden bg-[var(--black-warm)] border border-[var(--graphite)] ${isHero ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
                  <Image
                    src={vehicle.imageUrl || "/placeholder.svg"}
                    alt={vehicle.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    sizes={isHero ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                  />
                </div>
                <figcaption className="mt-5 grid grid-cols-[1fr_auto] items-baseline gap-x-4">
                  <h3 className={`font-display leading-tight text-[var(--text-primary)] ${isHero ? 'text-3xl lg:text-4xl' : 'text-2xl'}`}>
                    {vehicle.name}
                  </h3>
                  <span className="numeric text-[0.75rem] tracking-[0.16em] text-[var(--gold-text)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </figcaption>
                <dl className="mt-3 flex items-baseline gap-x-6 text-[0.875rem] text-[var(--text-secondary)]">
                  <div className="flex items-baseline gap-2">
                    <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Pax</dt>
                    <dd className="numeric text-[var(--text-primary)]">{vehicle.passengerCapacity}</dd>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <dt className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Bags</dt>
                    <dd className="numeric text-[var(--text-primary)]">{vehicle.luggageCapacity}</dd>
                  </div>
                </dl>
                {vehicle.description && (
                  <p className="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                    {vehicle.description}
                  </p>
                )}
              </motion.figure>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
