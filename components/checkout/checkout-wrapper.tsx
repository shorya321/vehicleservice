'use client'

import { useState, useCallback } from 'react'
import { BookingForm } from './booking-form'
import { OrderSummary } from './order-summary'
import { RouteDetails, VehicleTypeDetails, CheckoutAddonsByCategory } from '@/app/checkout/actions'

// Type for displaying addons in OrderSummary
export interface OrderSummaryAddon {
  id: string
  name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface FormMethods {
  submit: () => void
  isSubmitting: boolean
  agreeToTerms: boolean
  setAgreeToTerms: (value: boolean) => void
}

interface CheckoutWrapperProps {
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  initialDate: string
  initialTime: string
  initialPassengers: number
  initialLuggage: number
  user: any
  profile: any
  addonsByCategory: CheckoutAddonsByCategory[]
}

export function CheckoutWrapper({
  route,
  vehicleType,
  initialDate,
  initialTime,
  initialPassengers,
  initialLuggage,
  user,
  profile,
  addonsByCategory,
}: CheckoutWrapperProps) {
  const [infantSeats, setInfantSeats] = useState(0)
  const [boosterSeats, setBoosterSeats] = useState(0)
  const [currentLuggage, setCurrentLuggage] = useState(initialLuggage)
  const [pickupDate, setPickupDate] = useState(initialDate)
  const [pickupTime, setPickupTime] = useState(initialTime)
  const [selectedAddons, setSelectedAddons] = useState<OrderSummaryAddon[]>([])

  // Form methods state for connecting BookingForm to OrderSummary
  const [formMethods, setFormMethods] = useState<FormMethods>({
    submit: () => {},
    isSubmitting: false,
    agreeToTerms: false,
    setAgreeToTerms: () => {}
  })

  const handleExtrasChange = (infant: number, booster: number, luggage: number) => {
    setInfantSeats(infant)
    setBoosterSeats(booster)
    setCurrentLuggage(luggage)
  }

  const handleDateTimeChange = (date: string, time: string) => {
    setPickupDate(date)
    setPickupTime(time)
  }

  const handleAddonsChange = useCallback((addons: OrderSummaryAddon[]) => {
    setSelectedAddons(addons)
  }, [])

  const handleFormReady = useCallback((methods: FormMethods) => {
    setFormMethods(methods)
  }, [])

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {/* Main Booking Form */}
      <div className="flex-1 min-w-0">
        <BookingForm
          route={route}
          vehicleType={vehicleType}
          initialDate={initialDate}
          initialTime={initialTime}
          initialPassengers={initialPassengers}
          initialLuggage={initialLuggage}
          user={user}
          profile={profile}
          addonsByCategory={addonsByCategory}
          onExtrasChange={handleExtrasChange}
          onDateTimeChange={handleDateTimeChange}
          onAddonsChange={handleAddonsChange}
          onFormReady={handleFormReady}
        />
      </div>

      {/* Order Summary Sidebar - Sticky */}
      <div className="w-full lg:w-[420px] flex-shrink-0">
        <div className="lg:sticky lg:top-28">
          <OrderSummary
          route={route}
          vehicleType={vehicleType}
          passengers={initialPassengers}
          luggage={currentLuggage}
          infantSeats={infantSeats}
          boosterSeats={boosterSeats}
          pickupDate={pickupDate}
          pickupTime={pickupTime}
          onSubmit={formMethods.submit}
          isSubmitting={formMethods.isSubmitting}
          agreeToTerms={formMethods.agreeToTerms}
          onAgreeToTermsChange={formMethods.setAgreeToTerms}
          selectedAddons={selectedAddons}
        />
        </div>
      </div>
    </div>
  )
}
