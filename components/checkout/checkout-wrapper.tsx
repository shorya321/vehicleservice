'use client'

import { useState, useCallback } from 'react'
import { BookingForm } from './booking-form'
import { OrderSummary } from './order-summary'
import { MobileStickyBar } from './mobile-sticky-bar'
import { CheckoutStepHeader } from './checkout-step-header'
import { RouteDetails, VehicleTypeDetails, CheckoutAddonsByCategory } from '@/app/checkout/actions'
import type { GuestBreakdown } from '@/components/home/hero/guest-breakdown'

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
  removeAddon: (addonId: string) => void
}

interface CheckoutWrapperProps {
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  initialDate: string
  initialTime: string
  initialPassengers: number
  /** Adults/children/infants behind `initialPassengers`. Already clamped to the vehicle. */
  initialGuests: GuestBreakdown
  user: any
  profile: any
  addonsByCategory: CheckoutAddonsByCategory[]
  /** Where "Change vehicle" goes back to. Built server-side so a direct arrival, which has
      no history to pop, still lands on the right search results. */
  changeHref: string
}

const TOTAL_STEPS = 2

export function CheckoutWrapper({
  route,
  vehicleType,
  initialDate,
  initialTime,
  initialPassengers,
  initialGuests,
  user,
  profile,
  addonsByCategory,
  changeHref,
}: CheckoutWrapperProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [currentPassengers, setCurrentPassengers] = useState(initialPassengers)
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
    removeAddon: () => {},
  })

  const isLastStep = currentStep === TOTAL_STEPS - 1

  const basePrice = vehicleType.price || 50
  const addonsCost = selectedAddons.reduce((sum, addon) => sum + addon.total_price, 0)
  const totalPrice = basePrice + addonsCost

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
    // A fragment, not a wrapping div: the header keeps the `mb-12` each of its two parts
    // already carries, and the three elements stay direct children of `luxury-container`
    // exactly as they were when the server page rendered them.
    <>
      <CheckoutStepHeader currentStep={currentStep} />

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Main Booking Form */}
          <div className="flex-1 min-w-0 pb-[var(--sticky-bar-h,7rem)] lg:pb-0">
            <BookingForm
              route={route}
              vehicleType={vehicleType}
              initialDate={initialDate}
              initialTime={initialTime}
              initialPassengers={initialPassengers}
              initialGuests={initialGuests}
              user={user}
              profile={profile}
              addonsByCategory={addonsByCategory}
              changeHref={changeHref}
              currentStep={currentStep}
              direction={direction}
              onGoNext={goNext}
              onGoBack={goBack}
              onPassengersChange={handlePassengersChange}
              onDateTimeChange={handleDateTimeChange}
              onAddonsChange={handleAddonsChange}
              onFormReady={handleFormReady}
            />
          </div>

          {/* Order Summary Sidebar - Desktop only */}
          <div className="hidden lg:block w-[380px] xl:w-[420px] flex-shrink-0">
            <div className="lg:sticky lg:top-28">
              <OrderSummary
                route={route}
                vehicleType={vehicleType}
                passengers={currentPassengers}
                pickupDate={pickupDate}
                pickupTime={pickupTime}
                currentStep={currentStep}
                onSubmit={formMethods.submit}
                onContinue={formMethods.handleContinue}
                isSubmitting={formMethods.isSubmitting}
                agreeToTerms={formMethods.agreeToTerms}
                onAgreeToTermsChange={formMethods.setAgreeToTerms}
                selectedAddons={selectedAddons}
                // Only on the extras step: AdditionalServicesSection owns the selection and is
                // unmounted on step 0, so there would be nothing to remove from there anyway.
                onRemoveAddon={currentStep === 1 ? formMethods.removeAddon : undefined}
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
    </>
  )
}
