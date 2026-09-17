'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
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

/** The fixed site header the scroll target has to clear. `h-20` on desktop, a little less on a
    phone; one value covers both, since overshooting shows a sliver of the band above. */
const HEADER_CLEARANCE = 96

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
  const [currentGuests, setCurrentGuests] = useState<GuestBreakdown>(initialGuests)
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

  const handleGuestsChange = useCallback((next: GuestBreakdown) => {
    setCurrentGuests(next)
  }, [])

  /**
   * Take the new step's header with you.
   *
   * The wizard swaps the form in place, and the page does not move: pressing "Continue to
   * extras" from the bottom of the passenger fields left the viewport where it was, which is
   * somewhere in the middle of the extras list. The new step's title, its progress rail and its
   * back control were all above the fold, so the step looked like it had started halfway
   * through. Going back had the same problem in reverse.
   *
   * Skipped on the first render: an arrival must not be yanked anywhere, and a direct link to
   * checkout can legitimately restore a scroll position.
   */
  const stepHeaderRef = useRef<HTMLDivElement>(null)
  const hasStepped = useRef(false)

  useEffect(() => {
    if (!hasStepped.current) {
      hasStepped.current = true
      return
    }

    const node = stepHeaderRef.current
    if (!node) return

    // Focus first, without scrolling, so a screen reader announces the step it just moved to and
    // the keyboard lands at the top of the new step rather than wherever the pressed button was.
    node.focus({ preventScroll: true })

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const top = node.getBoundingClientRect().top + window.scrollY - HEADER_CLEARANCE
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'instant' : 'smooth' })
  }, [currentStep])

  const handleAddonsChange = useCallback((addons: OrderSummaryAddon[]) => {
    setSelectedAddons(addons)
  }, [])

  const handleFormReady = useCallback((methods: FormMethods) => {
    setFormMethods(methods)
  }, [])

  return (
    // Two full-bleed bands, the same grammar the home page and the rebuilt search results
    // run on. Each carries its own `.luxury-container`; the page shell supplies only the
    // ground. Neither band takes a seam, and both sit on `--black-void`: the same token
    // `main.pt-20`, the page shell and `body` already paint, so the header, the heading
    // and the form read as one surface. Band 2 used to be `--raised` with a graphite
    // hairline, which cut the page in two under the heading.
    <>
      {/* The two bands are one surface, so they share one seam rather than each spending a
          full editorial gap on it: 192px of empty ground used to sit between the subtitle and
          the first field. Utilities, which outrank the layered .editorial-section padding. */}
      <section className="editorial-section editorial-section--ground editorial-section--compact pb-8">
        <div className="luxury-container">
          {/* `tabIndex={-1}` makes this focusable programmatically only: it is the anchor the
              step change scrolls and moves focus to. `outline-none` because a mouse-driven step
              change must not paint a ring on a non-interactive block. */}
          <div ref={stepHeaderRef} tabIndex={-1} className="outline-none">
            <CheckoutStepHeader currentStep={currentStep} changeHref={changeHref} onBack={goBack} />
          </div>
        </div>
      </section>

      <section className="editorial-section editorial-section--ground grow pt-10">
        <div className="luxury-container">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Main Booking Form */}
            <div className="flex-1 min-w-0">
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
                onGuestsChange={handleGuestsChange}
                onDateTimeChange={handleDateTimeChange}
                onAddonsChange={handleAddonsChange}
                onFormReady={handleFormReady}
              />
            </div>

            {/* Order Summary Sidebar - Desktop only */}
            <div className="hidden lg:block w-[380px] xl:w-[420px] flex-shrink-0">
              <div className="lg:sticky lg:top-28">
                {/* The eyebrow lives inside the card now, as the stub's cap, so the plate
                    starts at the top of the sticky wrapper. */}
                <OrderSummary
                  route={route}
                  vehicleType={vehicleType}
                  passengers={currentPassengers}
                  guests={currentGuests}
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
        </div>
      </section>

      {/* Clears the fixed bar, which reports its own height as `--sticky-bar-h`. It used
          to be bottom padding on the form column; with a band below that, the space has
          to come after the last band instead. */}
      <div aria-hidden="true" className="h-[var(--sticky-bar-h,7rem)] lg:hidden" />

      {/* Mobile Sticky Bar */}
      <MobileStickyBar
    route={route}
    vehicleType={vehicleType}
    totalPrice={totalPrice}
    basePrice={basePrice}
    passengers={currentPassengers}
    guests={currentGuests}
    pickupDate={pickupDate}
    pickupTime={pickupTime}
    selectedAddons={selectedAddons}
    // Same condition the desktop card uses: AdditionalServicesSection owns the selection and
    // is unmounted on step 0, so there would be nothing to remove from there anyway.
    onRemoveAddon={currentStep === 1 ? formMethods.removeAddon : undefined}
    onContinue={formMethods.handleContinue}
    onSubmit={formMethods.submit}
    isSubmitting={formMethods.isSubmitting}
    isLastStep={isLastStep}
    agreeToTerms={formMethods.agreeToTerms}
    onAgreeToTermsChange={formMethods.setAgreeToTerms}
      />
    </>
  )
}
