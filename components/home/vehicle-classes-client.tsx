"use client"
import { useState, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import Image from "next/image"
import { VehicleClassCategory } from "@/app/actions"

interface VehicleClassesClientProps {
  categories: VehicleClassCategory[]
}

/**
 * The first card in a class spans both columns. Below three vehicles that
 * leaves a single narrow card stranded beside a wide one, so the promotion
 * only applies once the class is deep enough to fill the row under it.
 */
const HERO_MIN_VEHICLES = 3

/** Spec cell: label over figure, the same ledger pairing the routes grid uses. */
function Spec({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className="numeric text-[0.875rem] text-[var(--text-primary)]">{value}</dd>
    </div>
  )
}

function SectionHeader() {
  return (
    <>
      <div className="editorial-eyebrow">The fleet</div>
      <h2 id="fleet-heading" className="editorial-section-title--promoted mt-5">
        A small fleet, kept in order.
      </h2>
      <p className="editorial-body mt-6">
        Mercedes, BMW, and Cadillac on rotating annual leases. Choose by passenger count, luggage capacity, and the kind of arrival you want to make.
      </p>
    </>
  )
}

export function VehicleClassesClient({ categories }: VehicleClassesClientProps) {
  const reduceMotion = useReducedMotion()
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.categoryId || "")
  const tabsRef = useRef<Map<string, HTMLButtonElement>>(new Map())

  // The rail runs vertically, so Down/Up are the primary keys. Right/Left stay
  // bound as well: the roving tabindex pattern is the same either way, and a
  // reader who learned it on a horizontal tablist should not hit a dead key.
  const handleTabKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        newIndex = (currentIndex + 1) % categories.length
        break
      case 'ArrowUp':
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
          <header className="max-w-2xl">
            <SectionHeader />
          </header>
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
      {/*
        Two columns from 1000px: the class rail and the copy stay put while the
        vehicles scroll past them. Below that the aside stacks and the sticky
        drops, since a sticky header on a narrow screen just eats the viewport.
      */}
      <div className="luxury-container grid gap-10 min-[1000px]:grid-cols-[320px_1fr] min-[1000px]:items-start min-[1000px]:gap-14">
        {/*
          `whileInView` is ALWAYS supplied, with reduced motion collapsing only
          the duration and offset. The `whileInView={reduceMotion ? undefined :
          ...}` shape looks equivalent and is not: useReducedMotion() resolves
          false during SSR, so motion serialises opacity: 0 into the markup,
          then after hydration flips true, whileInView becomes undefined, and
          nothing animates the section back. Reduced-motion users got a
          permanently invisible section.
        */}
        <motion.header
          className="min-[1000px]:sticky min-[1000px]:top-24"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <SectionHeader />

          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="Vehicle categories"
            className="mt-8 flex flex-col border-t border-[var(--graphite)]"
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
                  className="fleet-tab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]"
                >
                  {category.categoryName}
                  <span className="fleet-tab__count">{category.vehicleTypes.length}</span>
                </button>
              )
            })}
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory.categoryId}
            role="tabpanel"
            id={`panel-${activeCategory.categoryId}`}
            aria-labelledby={`tab-${activeCategory.categoryId}`}
            className="grid gap-5 min-[640px]:grid-cols-2"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeCategory.vehicleTypes.map((vehicle, index) => {
              const isHero = index === 0 && activeCategory.vehicleTypes.length >= HERO_MIN_VEHICLES
              return (
                <motion.article
                  key={vehicle.id}
                  className={`fleet-card ${isHero ? 'min-[640px]:col-span-2' : ''}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* The wide crop belongs to the wide card. Below 640px the hero
                      spans one column like the rest, and 21/8 there is a letterbox. */}
                  <div className={`fleet-card__plate ${isHero ? 'aspect-[16/9] min-[640px]:aspect-[21/8]' : 'aspect-[16/9]'}`}>
                    <Image
                      src={vehicle.imageUrl || "/placeholder.svg"}
                      alt={vehicle.name}
                      fill
                      className="fleet-card__img"
                      sizes={isHero ? "(max-width: 640px) 100vw, (max-width: 1000px) 100vw, 60vw" : "(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 30vw"}
                    />
                  </div>

                  <div className="fleet-card__body">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className={`font-medium leading-tight tracking-[-0.018em] text-[var(--text-primary)] ${isHero ? 'text-[1.25rem]' : 'text-[1.0625rem]'}`}>
                        {vehicle.name}
                      </h3>
                      <span className="numeric text-[0.6875rem] tracking-[0.16em] text-[var(--gold-text)]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* The class name repeats on every card in a panel, so it
                        only earns a cell on the wide one. */}
                    <dl className="flex flex-wrap gap-x-7 gap-y-3">
                      <Spec label="Passengers" value={vehicle.passengerCapacity} />
                      <Spec label="Luggage" value={vehicle.luggageCapacity} />
                      {isHero && <Spec label="Class" value={activeCategory.categoryName} />}
                    </dl>

                    {vehicle.description && (
                      <p className="editorial-list-body mt-auto line-clamp-3">
                        {vehicle.description}
                      </p>
                    )}
                  </div>
                </motion.article>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
