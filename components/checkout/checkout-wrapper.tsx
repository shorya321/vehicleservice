'use client'

import { useState, useCallback } from 'react'
import { BookingForm } from './booking-form'
import { OrderSummary } from './order-summary'
import { MobileStickyBar } from './mobile-sticky-bar'
import { RouteDetails, VehicleTypeDetails, CheckoutAddonsByCategory } from '@/app/checkout/actions'

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
  trigger: (fields: string[]) => Promise<boolean>
  handleContinue: () => void
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

const TOTAL_STEPS = 2

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
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [infantSeats, setInfantSeats] = useState(0)
  const [boosterSeats, setBoosterSeats] = useState(0)
  const [currentPassengers, setCurrentPassengers] = useState(initialPassengers)
  const [currentLuggage, setCurrentLuggage] = useState(initialLuggage)
  const [pickupDate, setPickupDate] = useState(initialDate)
  const [pickupTime, setPickupTime] = useState(initialTime)
  const [selectedAddons, setSelectedAddons] = useState<OrderSummaryAddon[]>([])

  const [formMethods, setFormMethods] = useState<FormMethods>({
    submit: () => {},
    isSubmitting: false,
    agreeToTerms: false,
    setAgreeToTerms: () => {},
    trigger: async () => true,
    handleContinue: () => {},
  })

  const isLastStep = currentStep === TOTAL_STEPS - 1

  const basePrice = vehicleType.price || 50
  const extraLuggageCount = Math.max(0, currentLuggage - vehicleType.luggage_capacity)
  const extraLuggageCost = extraLuggageCount * 15
  const childSeatsCost = (infantSeats + boosterSeats) * 10
  const addonsCost = selectedAddons.reduce((sum, addon) => sum + addon.total_price, 0)
  const totalPrice = basePrice + extraLuggageCost + childSeatsCost + addonsCost

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setDirection(1)
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep])

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleExtrasChange = (infant: number, booster: number, luggage: number) => {
    setInfantSeats(infant)
    setBoosterSeats(booster)
    setCurrentLuggage(luggage)
  }

  const handleDateTimeChange = (date: string, time: string) => {
    setPickupDate(date)
    setPickupTime(time)
  }

  const handlePassengersChange = useCallback((count: number) => {
    setCurrentPassengers(count)
  }, [])

  const handleAddonsChange = useCallback((addons: OrderSummaryAddon[]) => {
    setSelectedAddons(addons)
  }, [])

  const handleFormReady = useCallback((methods: FormMethods) => {
    setFormMethods(methods)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
        {/* Main Booking Form */}
        <div className="flex-1 min-w-0 pb-28 lg:pb-0">
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
            currentStep={currentStep}
            direction={direction}
            onGoNext={goNext}
            onGoBack={goBack}
            onExtrasChange={handleExtrasChange}
            onPassengersChange={handlePassengersChange}
            onDateTimeChange={handleDateTimeChange}
            onAddonsChange={handleAddonsChange}
            onFormReady={handleFormReady}
          />
        </div>

        {/* Order Summary Sidebar - Desktop only */}
        <div className="hidden lg:block w-[420px] flex-shrink-0">
          <div className="lg:sticky lg:top-28">
            <OrderSummary
              route={route}
              vehicleType={vehicleType}
              passengers={currentPassengers}
              luggage={currentLuggage}
              infantSeats={infantSeats}
              boosterSeats={boosterSeats}
              pickupDate={pickupDate}
              pickupTime={pickupTime}
              currentStep={currentStep}
              onSubmit={formMethods.submit}
              isSubmitting={formMethods.isSubmitting}
              agreeToTerms={formMethods.agreeToTerms}
              onAgreeToTermsChange={formMethods.setAgreeToTerms}
              selectedAddons={selectedAddons}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bar */}
      <MobileStickyBar
        route={route}
        vehicleType={vehicleType}
        totalPrice={totalPrice}
        basePrice={basePrice}
        passengers={currentPassengers}
        luggage={currentLuggage}
        infantSeats={infantSeats}
        boosterSeats={boosterSeats}
        pickupDate={pickupDate}
        pickupTime={pickupTime}
        selectedAddons={selectedAddons}
        onContinue={formMethods.handleContinue}
        onSubmit={formMethods.submit}
        isSubmitting={formMethods.isSubmitting}
        isLastStep={isLastStep}
        agreeToTerms={formMethods.agreeToTerms}
        onAgreeToTermsChange={formMethods.setAgreeToTerms}
      />
    </div>
  )
}
