'use client'

import { useState, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { motion, useReducedMotion } from 'motion/react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { Check, Minus, Plus, Package } from 'lucide-react'
import { useCurrency } from '@/lib/currency/context'
import { formatPrice } from '@/lib/currency/format'
import { VehicleTypeDetails, CheckoutAddonsByCategory, CheckoutAddon } from '@/app/checkout/actions'
import { cn } from '@/lib/utils'

export interface SelectedCheckoutAddon {
  addon_id: string
  quantity: number
  unit_price: number
  total_price: number
}

interface AdditionalServicesSectionProps {
  form: UseFormReturn<any>
  vehicleType: VehicleTypeDetails // kept for future per-vehicle filtering
  addonsByCategory: CheckoutAddonsByCategory[]
}

function toKebabCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

const addonIconFallback = () => <Package className="h-4 w-4" aria-hidden="true" />

function AddonIcon({ iconName }: { iconName: string }) {
  return (
    <DynamicIcon
      name={toKebabCase(iconName) as any}
      className="h-4 w-4"
      aria-hidden="true"
      fallback={addonIconFallback}
    />
  )
}

export function AdditionalServicesSection({
  form,
  vehicleType,
  addonsByCategory
}: AdditionalServicesSectionProps) {
  const { setValue } = form
  const reduceMotion = useReducedMotion()
  const { currentCurrency, exchangeRates } = useCurrency()
  const formatAddonPrice = (amount: number) => formatPrice(amount, currentCurrency, exchangeRates)

  const [selectedAddons, setSelectedAddons] = useState<Map<string, SelectedCheckoutAddon>>(
    () => new Map((form.getValues('selectedAddons') ?? []).map((a: SelectedCheckoutAddon) => [a.addon_id, a]))
  )

  const getSelectedAddon = (addonId: string) => selectedAddons.get(addonId)

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

  useEffect(() => {
    setValue('selectedAddons', Array.from(selectedAddons.values()))
  }, [selectedAddons, setValue])

  if (addonsByCategory.length === 0) {
    return null
  }

  return (
    <div className="checkout-form-section">
      <div className="checkout-section-header">
        <h2 className="checkout-section-title">Additional Services</h2>
      </div>

      <div className="checkout-section-content space-y-6">
        {addonsByCategory.map((category) => (
          <div key={category.category} className="space-y-3">
            <div className="checkout-category-header">
              <span className="checkout-category-title">{category.category}</span>
              <span className="checkout-category-count">
                {category.addons.length} {category.addons.length === 1 ? 'option' : 'options'}
              </span>
            </div>
            {category.category.toLowerCase().includes('luggage') && (
              <p className="text-xs text-[var(--text-muted)] -mt-1">
                {vehicleType.luggage_capacity} bags included with your vehicle
              </p>
            )}
            <div className="checkout-services-grid">
              {category.addons.map((addon) => {
                const selected = getSelectedAddon(addon.id)
                const isSelected = !!selected
                const quantity = selected?.quantity || 0
                const isFree = addon.price === 0

                if (addon.pricing_type === 'per_unit') {
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
                            aria-label={`Decrease ${addon.name} quantity`}
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <motion.span
                            key={quantity}
                            className="checkout-quantity-value"
                            initial={reduceMotion ? false : { opacity: 0.4 }}
                            animate={reduceMotion ? undefined : { opacity: 1 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          >
                            {quantity}
                          </motion.span>
                          <button
                            type="button"
                            className="checkout-quantity-btn"
                            onClick={() => updateQuantity(addon, quantity + 1)}
                            disabled={quantity >= addon.max_quantity}
                            aria-label={`Increase ${addon.name} quantity`}
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
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
                    aria-label={`${addon.name}${isFree ? ' (free)' : `, ${formatAddonPrice(addon.price)}`}`}
                  >
                    <div className="checkout-service-checkbox">
                      {isSelected && <Check className="h-3 w-3 text-[var(--black-void)]" aria-hidden="true" />}
                    </div>
                    <div className="checkout-service-icon">
                      <AddonIcon iconName={addon.icon} />
                    </div>
                    <div className="checkout-service-content">
                      <p className="checkout-service-name">{addon.name}</p>
                      <p className="checkout-service-description">{addon.description}</p>
                    </div>
                    {isFree ? (
                      <span className="checkout-service-badge-free">Included</span>
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
    </div>
  )
}

AdditionalServicesSection.displayName = 'AdditionalServicesSection'
