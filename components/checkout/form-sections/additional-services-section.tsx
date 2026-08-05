'use client'

import { useState, useEffect, useMemo } from 'react'
import { UseFormReturn, useFormState } from 'react-hook-form'
import { motion, useReducedMotion } from 'motion/react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { Check, Minus, Plus, Package } from 'lucide-react'
import { useCurrency } from '@/lib/currency/context'
import { formatPrice } from '@/lib/currency/format'
import { GuestBreakdown } from '@/components/home/hero/guest-breakdown'
import { childSeatFitHint } from '@/lib/utils/child-seat-fit'
import { VehicleTypeDetails, CheckoutAddonsByCategory, CheckoutAddon } from '@/app/checkout/actions'
import { cn } from '@/lib/utils'

export interface SelectedCheckoutAddon {
  addon_id: string
  quantity: number
  unit_price: number
  total_price: number
  /**
   * One entry per selected unit; `null` until the customer picks that seat's age. Only present on
   * addons whose `requires_child_age` is set. The server re-derives the requirement from the DB.
   */
  child_ages?: (number | null)[]
  /** Rendering/validation hint only. Stripped by the server's zod schema. */
  requires_child_age?: boolean
}

interface AdditionalServicesSectionProps {
  form: UseFormReturn<any>
  vehicleType: VehicleTypeDetails // kept for future per-vehicle filtering
  addonsByCategory: CheckoutAddonsByCategory[]
  /** Drives the child-seat cap: seats can never outnumber the children + infants on the booking. */
  guests: GuestBreakdown
}

/** 0 renders as "Under 1". 12 is the ceiling. The Guests picker labels adults as "Age 12+". */
const CHILD_AGE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

function ageLabel(age: number): string {
  if (age === 0) return 'Under 1'
  return `${age} year${age === 1 ? '' : 's'}`
}

/** Grow with `null`s / truncate so the ages array always has exactly `quantity` entries. */
function resizeAges(existing: (number | null)[] | undefined, quantity: number): (number | null)[] {
  const next = (existing ?? []).slice(0, quantity)
  while (next.length < quantity) next.push(null)
  return next
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
  addonsByCategory,
  guests
}: AdditionalServicesSectionProps) {
  const { setValue } = form
  const reduceMotion = useReducedMotion()
  const { currentCurrency, exchangeRates } = useCurrency()
  const formatAddonPrice = (amount: number) => formatPrice(amount, currentCurrency, exchangeRates)

  const [rawSelected, setRawSelected] = useState<Map<string, SelectedCheckoutAddon>>(
    () => new Map((form.getValues('selectedAddons') ?? []).map((a: SelectedCheckoutAddon) => [a.addon_id, a]))
  )

  // Every child and infant occupies a seat and each needs its own restraint, so the number of
  // child seats can never exceed them. Guests live on step 0; this section re-reads them on mount.
  const childSeatCapacity = guests.children + guests.infants

  /**
   * Guests can be reduced on step 0 *after* seats were chosen here, which would leave a selection
   * the server rejects at submit. Rather than write the correction back into state from an effect
   * (a cascading render, and it would have to re-run on mount because this component unmounts
   * whenever the wizard is on step 0), the trim is derived: `rawSelected` keeps what the customer
   * asked for, and everything downstream reads this capped view.
   */
  const selectedAddons = useMemo(() => {
    let budget = childSeatCapacity
    let changed = false
    const next = new Map(rawSelected)
    for (const [id, sel] of Array.from(rawSelected.entries())) {
      if (!sel.requires_child_age) continue
      const q = Math.min(sel.quantity, budget)
      budget -= q
      if (q === sel.quantity) continue
      changed = true
      if (q <= 0) {
        next.delete(id)
      } else {
        next.set(id, {
          ...sel,
          quantity: q,
          total_price: sel.unit_price * q,
          child_ages: resizeAges(sel.child_ages, q),
        })
      }
    }
    return changed ? next : rawSelected
  }, [rawSelected, childSeatCapacity])

  const ageSeatsSelected = useMemo(
    () =>
      Array.from(selectedAddons.values())
        .filter(a => a.requires_child_age)
        .reduce((n, a) => n + a.quantity, 0),
    [selectedAddons]
  )

  const getSelectedAddon = (addonId: string) => selectedAddons.get(addonId)

  /**
   * A child seat is capped twice: by its own admin-configured `max_quantity`, and by how much of
   * the shared children+infants budget is still free once the *other* seats are accounted for.
   */
  const effectiveMax = (addon: CheckoutAddon, currentQty: number) =>
    addon.requires_child_age
      ? Math.min(addon.max_quantity, currentQty + Math.max(0, childSeatCapacity - ageSeatsSelected))
      : addon.max_quantity

  const toggleAddon = (addon: CheckoutAddon) => {
    const newSelected = new Map(selectedAddons)
    if (newSelected.has(addon.id)) {
      newSelected.delete(addon.id)
    } else {
      // A fixed-price addon is always quantity 1, so adding one needs one free seat in the budget.
      if (addon.requires_child_age && ageSeatsSelected >= childSeatCapacity) return
      newSelected.set(addon.id, {
        addon_id: addon.id,
        quantity: 1,
        unit_price: addon.price,
        total_price: addon.price,
        ...(addon.requires_child_age
          ? { child_ages: resizeAges(undefined, 1), requires_child_age: true }
          : {}),
      })
    }
    setRawSelected(newSelected)
  }

  const updateQuantity = (addon: CheckoutAddon, newQuantity: number) => {
    const newSelected = new Map(selectedAddons)
    const current = newSelected.get(addon.id)
    if (newQuantity <= 0) {
      newSelected.delete(addon.id)
    } else if (newQuantity <= effectiveMax(addon, current?.quantity ?? 0)) {
      newSelected.set(addon.id, {
        addon_id: addon.id,
        quantity: newQuantity,
        unit_price: addon.price,
        total_price: addon.price * newQuantity,
        ...(addon.requires_child_age
          ? { child_ages: resizeAges(current?.child_ages, newQuantity), requires_child_age: true }
          : {}),
      })
    }
    setRawSelected(newSelected)
  }

  const setChildAge = (addon: CheckoutAddon, index: number, age: number | null) => {
    const newSelected = new Map(selectedAddons)
    const current = newSelected.get(addon.id)
    if (!current) return
    const ages = resizeAges(current.child_ages, current.quantity)
    ages[index] = age
    newSelected.set(addon.id, { ...current, child_ages: ages })
    setRawSelected(newSelected)
  }

  // `shouldValidate` only once an error is already showing: under mode 'onTouched' validating
  // eagerly would flag missing ages the moment a seat is added, before the customer could fill
  // them in. Once the message IS on screen it must clear as soon as the last age is chosen.
  useEffect(() => {
    const hasError = !!form.getFieldState('selectedAddons').error
    setValue('selectedAddons', Array.from(selectedAddons.values()), { shouldValidate: hasError })
  }, [selectedAddons, setValue, form])

  // Subscribe directly rather than reading form.formState.errors: BookingForm builds its step
  // sections inside a useMemo that does not depend on `errors`, so this component would not
  // re-render when validation fails and the per-select markers would never appear.
  const { errors: subscribedErrors } = useFormState({ control: form.control, name: 'selectedAddons' })
  const showAgeErrors = !!subscribedErrors.selectedAddons

  // Candidates the fit hint can suggest instead. Taken from the full catalogue rather than the
  // visible categories, and kept in display_order so the named seat matches what is on screen.
  const ageRequiringAddons = useMemo(
    () => addonsByCategory.flatMap(c => c.addons).filter(a => a.requires_child_age),
    [addonsByCategory]
  )

  // With no children or infants declared there is nothing a child seat could be for, so the whole
  // group disappears rather than rendering as permanently unusable.
  const visibleCategories = useMemo(() => {
    if (childSeatCapacity > 0) return addonsByCategory
    return addonsByCategory
      .map(c => ({ ...c, addons: c.addons.filter(a => !a.requires_child_age) }))
      .filter(c => c.addons.length > 0)
  }, [addonsByCategory, childSeatCapacity])

  if (visibleCategories.length === 0) {
    return null
  }

  const renderAgeFields = (addon: CheckoutAddon, selected: SelectedCheckoutAddon | undefined) => {
    if (!addon.requires_child_age || !selected) return null
    const ages = resizeAges(selected.child_ages, selected.quantity)
    return (
      <div className="checkout-service-ages">
        {ages.map((value, i) => {
          const missing = showAgeErrors && value === null
          // Advisory only. The age options stay 0-12 for every seat on purpose, so that a
          // mismatch stays visible instead of being hidden by a narrowed list.
          const fitHint = childSeatFitHint(value, addon, ageRequiringAddons)
          const hintId = `age-hint-${addon.id}-${i}`
          return (
            <label key={i} className="checkout-service-age-field">
              <span className="checkout-service-age-label">
                {ages.length > 1 ? `Child ${i + 1} age` : 'Child age'}
              </span>
              <select
                className="checkout-service-age-select"
                value={value === null ? '' : String(value)}
                aria-invalid={missing}
                aria-describedby={fitHint ? hintId : undefined}
                onChange={(e) =>
                  setChildAge(addon, i, e.target.value === '' ? null : Number(e.target.value))
                }
              >
                <option value="">Select</option>
                {CHILD_AGE_OPTIONS.map(a => (
                  <option key={a} value={a}>{ageLabel(a)}</option>
                ))}
              </select>
              {missing && <span className="checkout-service-age-error">Required</span>}
              {fitHint && (
                <span id={hintId} className="checkout-service-age-hint">
                  {fitHint}
                </span>
              )}
            </label>
          )
        })}
      </div>
    )
  }

  return (
    <div className="checkout-form-section">
      <div className="checkout-section-header">
        <h2 className="checkout-section-title">Additional Services</h2>
      </div>

      <div className="checkout-section-content space-y-6">
        {visibleCategories.map((category) => {
          const isChildSeatCategory = category.addons.every(a => a.requires_child_age)
          return (
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
              {isChildSeatCategory && (
                <p className="text-xs text-[var(--text-muted)] -mt-1">
                  {ageSeatsSelected} of {childSeatCapacity} seat{childSeatCapacity === 1 ? '' : 's'} selected
                  {' · '}one per child or infant on this booking
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
                              disabled={quantity >= effectiveMax(addon, quantity)}
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
                        {renderAgeFields(addon, selected)}
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
                      onClick={(e) => {
                        // A fixed-price addon can also require an age. The card is the toggle, so
                        // clicks inside the age block must not deselect it.
                        if ((e.target as HTMLElement).closest('.checkout-service-ages')) return
                        toggleAddon(addon)
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if ((e.target as HTMLElement).closest('.checkout-service-ages')) return
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleAddon(addon)
                        }
                      }}
                      aria-pressed={isSelected}
                      aria-label={`${addon.name}${isFree ? ' (free)' : `, ${formatAddonPrice(addon.price)}`}`}
                    >
                      <div className="checkout-service-checkbox">
                        {isSelected && <Check className="h-3 w-3 text-[var(--onyx)]" aria-hidden="true" />}
                      </div>
                      <div className="checkout-service-icon">
                        <AddonIcon iconName={addon.icon} />
                      </div>
                      <div className="checkout-service-content">
                        <p className="checkout-service-name">{addon.name}</p>
                        <p className="checkout-service-description">{addon.description}</p>
                        {renderAgeFields(addon, selected)}
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
          )
        })}
      </div>
    </div>
  )
}

AdditionalServicesSection.displayName = 'AdditionalServicesSection'
