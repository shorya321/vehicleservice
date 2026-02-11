"use client"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Users, Luggage } from "lucide-react"
import Image from "next/image"
import { VehicleClassCategory } from "@/app/actions"

interface VehicleClassesClientProps {
  categories: VehicleClassCategory[]
}

export function VehicleClassesClient({ categories }: VehicleClassesClientProps) {
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.categoryId || "")
  const tabsRef = useRef<Map<string, HTMLButtonElement>>(new Map())

  const handleTabKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex

    switch(e.key) {
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

    // Focus the new tab
    const newTabButton = tabsRef.current.get(newCategory.categoryId)
    newTabButton?.focus()
  }

  // If no categories, show empty state
  if (categories.length === 0) {
    return (
      <section className="section-padding fleet-section">
        <div className="luxury-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
          >
            <span className="section-eyebrow">Our Collection</span>
            <h2 className="section-title">Vehicle Classes</h2>
            <div className="section-divider">
              <div className="section-divider-icon"></div>
            </div>
            <p className="section-subtitle">
              Solo or group transfer? Choose your perfect fit from our diverse range of vehicles.
            </p>
          </motion.div>
          <div className="text-center py-12">
            <p className="text-[var(--text-muted)]">No vehicle classes available at the moment.</p>
          </div>
        </div>
      </section>
    )
  }

  const activeCategory = categories.find(cat => cat.categoryId === activeTab) || categories[0]

  return (
    <section className="section-padding fleet-section" id="fleet">
      <div className="luxury-container">
        {/* Section Header */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <span className="section-eyebrow">Our Collection</span>
          <h2 className="section-title">Vehicle Classes</h2>
          <div className="section-divider">
            <div className="section-divider-icon"></div>
          </div>
          <p className="section-subtitle">
            Solo or group transfer? Choose your perfect fit from our diverse range of vehicles.
          </p>
        </motion.div>

        {/* Pill-Style Tabs */}
        <motion.div
          role="tablist"
          aria-label="Vehicle categories"
          className="fleet-tabs mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          {categories.map((category, index) => (
            <button
              key={category.categoryId}
              ref={(el) => {
                if (el) tabsRef.current.set(category.categoryId, el)
              }}
              className={`fleet-tab ${activeTab === category.categoryId ? 'active' : ''}`}
              onClick={() => setActiveTab(category.categoryId)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              role="tab"
              aria-selected={activeTab === category.categoryId}
              aria-controls={`panel-${category.categoryId}`}
              id={`tab-${category.categoryId}`}
              tabIndex={activeTab === category.categoryId ? 0 : -1}
            >
              {category.categoryName}
            </button>
          ))}
        </motion.div>

        {/* Vehicle Cards Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory.categoryId}
            role="tabpanel"
            id={`panel-${activeCategory.categoryId}`}
            aria-labelledby={`tab-${activeCategory.categoryId}`}
            className="grid sm:grid-cols-2 gap-[var(--space-xl)] max-w-[900px] mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeCategory.vehicleTypes.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                className="fleet-card group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Image Container */}
                <div className="relative w-full aspect-[16/10] overflow-hidden">
                  <Image
                    src={vehicle.imageUrl || "/placeholder.svg"}
                    alt={vehicle.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Gradient fade at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--charcoal)] via-transparent to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <h3 className="font-display text-xl text-[var(--text-primary)] mb-3">
                    {vehicle.name}
                  </h3>

                  {/* Specs */}
                  <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)] mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-[var(--gold)]" aria-hidden="true" />
                      <span className="sr-only">Passengers:</span>
                      {vehicle.passengerCapacity}
                    </span>
                    <span className="flex items-center gap-1">
                      <Luggage className="w-4 h-4 text-[var(--gold)]" aria-hidden="true" />
                      <span className="sr-only">Luggage:</span>
                      {vehicle.luggageCapacity}
                    </span>
                  </div>

                  {vehicle.description && (
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-2">
                      {vehicle.description}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
