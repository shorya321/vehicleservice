'use client'

import { useState, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import * as LucideIcons from 'lucide-react'
import { Check, Minus, Plus, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
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

  // Calculate total addons price
  const totalAddonsPrice = Array.from(selectedAddons.values()).reduce(
    (sum, addon) => sum + addon.total_price,
    0
  )

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
      <div className="checkout-section-content space-y-6">
        {/* Dynamic Addon Categories */}
        {addonsByCategory.map((category) => (
          <div key={category.category} className="space-y-3">
            <h4 className="text-sm font-medium text-[#b8b4ae]">{category.category}</h4>
            <div className="checkout-services-grid">
              {category.addons.map((addon) => {
                const selected = getSelectedAddon(addon.id)
                const isSelected = !!selected
                const quantity = selected?.quantity || 0
                const isFree = addon.price === 0

                if (addon.pricing_type === 'per_unit') {
                  // Per-unit addon with quantity controls
                  return (
                    <div
                      key={addon.id}
                      className={cn(
                        "checkout-service-card",
                        isSelected && "selected"
                      )}
                    >
                      <div className="checkout-service-checkbox">
                        {isSelected && <Check className="h-3 w-3 text-[#050506]" />}
                      </div>
                      <div className="checkout-service-icon">
                        <AddonIcon iconName={addon.icon} />
                      </div>
                      <div className="checkout-service-content">
                        <p className="checkout-service-name">{addon.name}</p>
                        <p className="checkout-service-description">
                          {addon.description || `Up to ${addon.max_quantity} available`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-[#f8f6f3] hover:bg-[#c6aa88]/20"
                            onClick={() => updateQuantity(addon, quantity - 1)}
                            disabled={quantity === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm text-[#f8f6f3] w-5 text-center">{quantity}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-[#f8f6f3] hover:bg-[#c6aa88]/20"
                            onClick={() => updateQuantity(addon, quantity + 1)}
                            disabled={quantity >= addon.max_quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="checkout-service-price">
                          {formatCurrency(addon.price)}/ea
                        </span>
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
                      isSelected && "selected"
                    )}
                    onClick={() => toggleAddon(addon)}
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
                    <span className={cn(
                      "checkout-service-price",
                      isFree && "checkout-service-price-free"
                    )}>
                      {isFree ? 'Free' : `+${formatCurrency(addon.price)}`}
                    </span>
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
