'use client'

import { useState, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { motion } from 'motion/react'
import * as LucideIcons from 'lucide-react'
import { Check, Minus, Plus, Package } from 'lucide-react'
import { useCurrency } from '@/lib/currency/context'
import { formatPrice } from '@/lib/currency/format'
import { VehicleTypeDetails, CheckoutAddonsByCategory, CheckoutAddon } from '@/app/checkout/actions'
import { cn } from '@/lib/utils'

// Selected addon type for tracking
export interface SelectedCheckoutAddon {
  addon_id: string
  quantity: number
  unit_price: number
  total_price: number
}

interface AdditionalServicesSectionProps {
  form: UseFormReturn<any>
  vehicleType: VehicleTypeDetails
  addonsByCategory: CheckoutAddonsByCategory[]
}

// Dynamic icon component
function AddonIcon({ iconName }: { iconName: string }) {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
  if (!IconComponent) return <Package className="h-5 w-5" />
  return <IconComponent className="h-5 w-5" />
}

/**
 * Additional Services Section Component
 *
 * Database-driven addon selection:
 * - Dynamically loads addons from database by category
 * - Fixed-price addons: Toggle selection
 * - Per-unit addons: Quantity controls (+/- buttons)
 * - Real-time price calculation
 *
 * @component
 */
export function AdditionalServicesSection({
  form,
  vehicleType,
  addonsByCategory
}: AdditionalServicesSectionProps) {
  const { setValue } = form
  const { currentCurrency, exchangeRates } = useCurrency()
  const formatAddonPrice = (amount: number) => formatPrice(amount, currentCurrency, exchangeRates)

  // Track selected addons
  const [selectedAddons, setSelectedAddons] = useState<Map<string, SelectedCheckoutAddon>>(new Map())

  // Get selected addon helper
  const getSelectedAddon = (addonId: string) => selectedAddons.get(addonId)

  // Toggle fixed-price addon
  const toggleAddon = (addon: CheckoutAddon) => {
    const newSelected = new Map(selectedAddons)
    if (newSelected.has(addon.id)) {
      newSelected.delete(addon.id)
    } else {
      newSelected.set(addon.id, {
        addon_id: addon.id,
        quantity: 1,
        unit_price: addon.price,
        total_price: addon.price,
      })
    }
    setSelectedAddons(newSelected)
  }

  // Update quantity for per-unit addon
  const updateQuantity = (addon: CheckoutAddon, newQuantity: number) => {
    const newSelected = new Map(selectedAddons)
    if (newQuantity <= 0) {
      newSelected.delete(addon.id)
    } else if (newQuantity <= addon.max_quantity) {
      newSelected.set(addon.id, {
        addon_id: addon.id,
        quantity: newQuantity,
        unit_price: addon.price,
        total_price: addon.price * newQuantity,
      })
    }
    setSelectedAddons(newSelected)
  }

  // Sync selected addons to form
  useEffect(() => {
    setValue('selectedAddons', Array.from(selectedAddons.values()))
  }, [selectedAddons, setValue])

  if (addonsByCategory.length === 0) {
    return null
  }

  return (
    <motion.div
      className="checkout-form-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Section Header */}
      <div className="checkout-section-header">
        <span className="checkout-section-number">3</span>
        <h2 className="checkout-section-title">Additional Services</h2>
        <Package className="checkout-section-icon" />
      </div>

      {/* Section Content */}
      <div className="checkout-section-content space-y-8">
        {/* Dynamic Addon Categories */}
        {addonsByCategory.map((category) => (
          <div key={category.category} className="space-y-4">
            <div className="checkout-category-header">
              <span className="checkout-category-title">{category.category}</span>
              <span className="checkout-category-count">
                {category.addons.length} {category.addons.length === 1 ? 'option' : 'options'}
              </span>
            </div>
            <div className="checkout-services-grid">
              {category.addons.map((addon) => {
                const selected = getSelectedAddon(addon.id)
                const isSelected = !!selected
                const quantity = selected?.quantity || 0
                const isFree = addon.price === 0

                if (addon.pricing_type === 'per_unit') {
                  // Per-unit addon with quantity controls (no checkbox)
                  return (
                    <div
                      key={addon.id}
                      className={cn(
                        "checkout-service-card checkout-service-card--per-unit",
                        isSelected && "selected"
                      )}
                    >
                      <div className="checkout-service-card-header">
                        <div className="checkout-service-icon">
                          <AddonIcon iconName={addon.icon} />
                        </div>
                        <div className="checkout-service-content">
                          <p className="checkout-service-name">{addon.name}</p>
                          <p className="checkout-service-description">
                            {addon.description || `Up to ${addon.max_quantity} available`}
                          </p>
                        </div>
                        <span className="checkout-service-price">
                          {formatAddonPrice(addon.price)}<span className="checkout-service-price-unit">/ea</span>
                        </span>
                      </div>
                      <div className="checkout-service-card-controls">
                        <div className="checkout-quantity-controls">
                          <button
                            type="button"
                            className="checkout-quantity-btn"
                            onClick={() => updateQuantity(addon, quantity - 1)}
                            disabled={quantity === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="checkout-quantity-value">{quantity}</span>
                          <button
                            type="button"
                            className="checkout-quantity-btn"
                            onClick={() => updateQuantity(addon, quantity + 1)}
                            disabled={quantity >= addon.max_quantity}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {isSelected && (
                          <span className="checkout-service-line-total">
                            {formatAddonPrice(addon.price * quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                }

                // Fixed-price addon with toggle
                return (
                  <div
                    key={addon.id}
                    className={cn(
                      "checkout-service-card",
                      isFree && "checkout-service-card--free",
                      isSelected && "selected"
                    )}
                    onClick={() => toggleAddon(addon)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleAddon(addon)
                      }
                    }}
                    aria-pressed={isSelected}
                  >
                    <div className="checkout-service-checkbox">
                      {isSelected && <Check className="h-3 w-3 text-[#050506]" />}
                    </div>
                    <div className="checkout-service-icon">
                      <AddonIcon iconName={addon.icon} />
                    </div>
                    <div className="checkout-service-content">
                      <p className="checkout-service-name">{addon.name}</p>
                      <p className="checkout-service-description">{addon.description}</p>
                    </div>
                    {isFree ? (
                      <span className="checkout-service-badge-free">Free</span>
                    ) : (
                      <span className="checkout-service-price">
                        +{formatAddonPrice(addon.price)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

      </div>
    </motion.div>
  )
}

AdditionalServicesSection.displayName = 'AdditionalServicesSection'
