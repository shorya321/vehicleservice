'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Baby, Briefcase, Wifi, Coffee, HeadphonesIcon, HandHeart, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { VehicleTypeDetails } from '@/app/checkout/actions'
import { cn } from '@/lib/utils'

interface AdditionalServicesSectionProps {
  form: UseFormReturn<any>
  vehicleType: VehicleTypeDetails
  luggage: number
  setLuggage: (value: number) => void
}

interface ServiceCard {
  id: string
  name: string
  description: string
  price: number
  icon: React.ElementType
  isFree?: boolean
  defaultSelected?: boolean
}

/**
 * Additional Services Section Component
 *
 * Manages optional booking add-ons:
 * - Child seats (infant and booster) with pricing
 * - Luggage management with capacity tracking and extra bag fees
 * - Meet & Greet service
 * - WiFi, Refreshments, Priority Support
 *
 * @component
 */
export function AdditionalServicesSection({
  form,
  vehicleType,
  luggage,
  setLuggage
}: AdditionalServicesSectionProps) {
  const { watch, setValue } = form

  // Service states
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set(['meet-greet', 'refreshments']))

  // Calculate extra luggage based on vehicle capacity
  const extraLuggageCount = Math.max(0, luggage - vehicleType.luggage_capacity)
  const extraLuggageCost = extraLuggageCount * 15 // $15 per extra bag

  const infantSeats = watch('infantSeats')
  const boosterSeats = watch('boosterSeats')

  const services: ServiceCard[] = [
    {
      id: 'meet-greet',
      name: 'Meet & Greet',
      description: 'Driver with name board at arrival',
      price: 0,
      icon: HandHeart,
      isFree: true,
      defaultSelected: true
    },
    {
      id: 'child-seat',
      name: 'Child Seat',
      description: 'Infant or booster seat available',
      price: 10,
      icon: Baby
    },
    {
      id: 'extra-luggage',
      name: 'Extra Luggage',
      description: `${vehicleType.luggage_capacity} bags included`,
      price: 15,
      icon: Briefcase
    },
    {
      id: 'wifi',
      name: 'In-Car WiFi',
      description: 'High-speed internet access',
      price: 8,
      icon: Wifi
    },
    {
      id: 'refreshments',
      name: 'Refreshments',
      description: 'Complimentary water & snacks',
      price: 0,
      icon: Coffee,
      isFree: true,
      defaultSelected: true
    },
    {
      id: 'priority-support',
      name: 'Priority Support',
      description: '24/7 dedicated assistance',
      price: 5,
      icon: HeadphonesIcon
    }
  ]

  const toggleService = (id: string) => {
    const newSelected = new Set(selectedServices)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedServices(newSelected)
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
        <Briefcase className="checkout-section-icon" />
      </div>

      {/* Section Content */}
      <div className="checkout-section-content space-y-6">
        {/* Service Cards Grid */}
        <div className="checkout-services-grid">
          {services.map((service) => {
            const isSelected = selectedServices.has(service.id)
            const Icon = service.icon

            // Special handling for child seat and luggage
            if (service.id === 'child-seat') {
              return (
                <div
                  key={service.id}
                  className={cn(
                    "checkout-service-card",
                    (infantSeats > 0 || boosterSeats > 0) && "selected"
                  )}
                >
                  <div className="checkout-service-checkbox">
                    {(infantSeats > 0 || boosterSeats > 0) && (
                      <Check className="h-3 w-3 text-[#050506]" />
                    )}
                  </div>
                  <div className="checkout-service-icon">
                    <Icon className="h-5 w-5 text-[#c6aa88]" />
                  </div>
                  <div className="checkout-service-content">
                    <p className="checkout-service-name">{service.name}</p>
                    <p className="checkout-service-description">
                      {infantSeats + boosterSeats > 0
                        ? `${infantSeats} infant + ${boosterSeats} booster`
                        : service.description
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-[#f8f6f3] hover:bg-[#c6aa88]/20"
                        onClick={() => {
                          const current = infantSeats
                          setValue('infantSeats', Math.max(0, current - 1))
                        }}
                      >
                        -
                      </Button>
                      <span className="text-sm text-[#f8f6f3] w-5 text-center">{infantSeats + boosterSeats}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-[#f8f6f3] hover:bg-[#c6aa88]/20"
                        onClick={() => {
                          const current = infantSeats
                          setValue('infantSeats', Math.min(4, current + 1))
                        }}
                      >
                        +
                      </Button>
                    </div>
                    <span className="checkout-service-price">
                      {formatCurrency(service.price)}/ea
                    </span>
                  </div>
                </div>
              )
            }

            if (service.id === 'extra-luggage') {
              return (
                <div
                  key={service.id}
                  className={cn(
                    "checkout-service-card",
                    extraLuggageCount > 0 && "selected"
                  )}
                >
                  <div className="checkout-service-checkbox">
                    {extraLuggageCount > 0 && (
                      <Check className="h-3 w-3 text-[#050506]" />
                    )}
                  </div>
                  <div className="checkout-service-icon">
                    <Icon className="h-5 w-5 text-[#c6aa88]" />
                  </div>
                  <div className="checkout-service-content">
                    <p className="checkout-service-name">{service.name}</p>
                    <p className="checkout-service-description">
                      {luggage} of {vehicleType.luggage_capacity} included
                      {extraLuggageCount > 0 && (
                        <span className="text-[#c6aa88]"> (+{extraLuggageCount} extra)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-[#f8f6f3] hover:bg-[#c6aa88]/20"
                        onClick={() => {
                          const newLuggage = Math.max(0, luggage - 1)
                          setLuggage(newLuggage)
                          setValue('luggageCount', newLuggage)
                          setValue('extraLuggageCount', Math.max(0, newLuggage - vehicleType.luggage_capacity))
                        }}
                      >
                        -
                      </Button>
                      <span className="text-sm text-[#f8f6f3] w-5 text-center">{luggage}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-[#f8f6f3] hover:bg-[#c6aa88]/20"
                        onClick={() => {
                          const newLuggage = Math.min(20, luggage + 1)
                          setLuggage(newLuggage)
                          setValue('luggageCount', newLuggage)
                          setValue('extraLuggageCount', Math.max(0, newLuggage - vehicleType.luggage_capacity))
                        }}
                      >
                        +
                      </Button>
                    </div>
                    <span className="checkout-service-price">
                      {formatCurrency(service.price)}/ea
                    </span>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={service.id}
                className={cn(
                  "checkout-service-card",
                  isSelected && "selected"
                )}
                onClick={() => toggleService(service.id)}
              >
                <div className="checkout-service-checkbox">
                  {isSelected && <Check className="h-3 w-3 text-[#050506]" />}
                </div>
                <div className="checkout-service-icon">
                  <Icon className="h-5 w-5 text-[#c6aa88]" />
                </div>
                <div className="checkout-service-content">
                  <p className="checkout-service-name">{service.name}</p>
                  <p className="checkout-service-description">{service.description}</p>
                </div>
                <span className={cn(
                  "checkout-service-price",
                  service.isFree && "checkout-service-price-free"
                )}>
                  {service.isFree ? 'Free' : `+${formatCurrency(service.price)}`}
                </span>
              </div>
            )
          })}
        </div>

        {/* Cost Summary */}
        {(infantSeats + boosterSeats > 0 || extraLuggageCount > 0) && (
          <div className="p-4 bg-[#1f1e1c]/30 border border-[#c6aa88]/10 rounded-lg">
            <p className="text-sm text-[#b8b4ae] mb-2">Additional Costs:</p>
            <div className="space-y-1">
              {(infantSeats + boosterSeats > 0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#b8b4ae]">Child Seats ({infantSeats + boosterSeats})</span>
                  <span className="text-[#c6aa88]">+{formatCurrency((infantSeats + boosterSeats) * 10)}</span>
                </div>
              )}
              {extraLuggageCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#b8b4ae]">Extra Luggage ({extraLuggageCount})</span>
                  <span className="text-[#c6aa88]">+{formatCurrency(extraLuggageCost)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

AdditionalServicesSection.displayName = 'AdditionalServicesSection'
