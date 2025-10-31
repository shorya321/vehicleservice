"use client"
import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
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
      <div className="section-padding">
        <div className="luxury-container">
          <motion.div
            className="section-title-wrapper"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Vehicle Classes</h2>
            <div className="section-divider"></div>
            <p className="section-subtitle">
              Solo or group transfer? Choose your perfect fit from our diverse range of vehicles.
            </p>
          </motion.div>
          <div className="text-center py-12">
            <p className="text-luxury-lightGray">No vehicle classes available at the moment.</p>
          </div>
        </div>
      </div>
    )
  }

  const activeCategory = categories.find(cat => cat.categoryId === activeTab) || categories[0]

  return (
    <div className="section-padding">
      <div className="luxury-container">
        <motion.div
          className="section-title-wrapper"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Vehicle Classes</h2>
          <div className="section-divider"></div>
          <p className="section-subtitle">
            Solo or group transfer? Choose your perfect fit from our diverse range of vehicles.
          </p>
        </motion.div>

        <motion.div
          role="tablist"
          aria-label="Vehicle categories"
          className="mb-10 flex justify-center flex-wrap gap-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          {categories.map((category, index) => (
            <Button
              key={category.categoryId}
              ref={(el) => {
                if (el) tabsRef.current.set(category.categoryId, el)
              }}
              variant={activeTab === category.categoryId ? "default" : "outline"}
              onClick={() => setActiveTab(category.categoryId)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              size="default"
              role="tab"
              aria-selected={activeTab === category.categoryId}
              aria-controls={`panel-${category.categoryId}`}
              id={`tab-${category.categoryId}`}
              tabIndex={activeTab === category.categoryId ? 0 : -1}
            >
              {category.categoryName.toUpperCase()}
            </Button>
          ))}
        </motion.div>

        <div
          role="tabpanel"
          id={`panel-${activeCategory.categoryId}`}
          aria-labelledby={`tab-${activeCategory.categoryId}`}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {activeCategory.vehicleTypes.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              className="luxury-card luxury-card-hover flex flex-col p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            >
              <div className="relative w-full aspect-video mb-5 rounded-md overflow-hidden">
                <Image
                  src={vehicle.imageUrl || "/placeholder.svg"}
                  alt={vehicle.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <h3 className="text-xl font-serif text-luxury-pearl mb-1">{vehicle.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-luxury-lightGray mb-3">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1.5 text-luxury-gold" aria-hidden="true" />
                  <span className="sr-only">Passengers:</span> {vehicle.passengerCapacity}
                </span>
                <span className="flex items-center">
                  <Luggage className="w-4 h-4 mr-1.5 text-luxury-gold" aria-hidden="true" />
                  <span className="sr-only">Luggage:</span> {vehicle.luggageCapacity}
                </span>
              </div>
              {vehicle.description && (
                <p className="text-xs text-luxury-lightGray/70 mb-5 flex-grow">{vehicle.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
