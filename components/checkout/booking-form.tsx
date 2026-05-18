'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { RouteDetails, VehicleTypeDetails, CheckoutAddonsByCategory, createBooking } from '@/app/checkout/actions'
import { OrderSummaryAddon } from './checkout-wrapper'
import { toast } from 'sonner'
import { buildPaymentUrl } from '@/lib/utils/url-builder'

import { TransferDetailsSection } from './form-sections/transfer-details-section'
import { PassengerInfoSection } from './form-sections/passenger-info-section'
import { AdditionalServicesSection } from './form-sections/additional-services-section'
import { PaymentMethodSection } from './form-sections/payment-method-section'
import { WizardNavigation } from './wizard-navigation'
import { StepErrorSummary } from './step-error-summary'

const selectedAddonSchema = z.object({
  addon_id: z.string().uuid(),
  quantity: z.number().min(1).max(10),
  unit_price: z.number().min(0),
  total_price: z.number().min(0),
})

const bookingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  pickupDate: z.string().min(1, 'Pickup date is required'),
  pickupTime: z.string().min(1, 'Pickup time is required'),
  flightNumber: z.string().optional(),
  specialRequests: z.string().optional(),
  infantSeats: z.number().min(0).max(4),
  boosterSeats: z.number().min(0).max(4),
  luggageCount: z.number().min(0).max(50),
  extraLuggageCount: z.number().min(0),
  paymentMethod: z.enum(['card']),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
  selectedAddons: z.array(selectedAddonSchema).optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

const STEP_FIELDS: Record<number, (keyof BookingFormData)[]> = {
  0: ['pickupDate', 'pickupTime', 'firstName', 'lastName', 'email', 'phone'],
  1: ['paymentMethod'],
}

const TOTAL_STEPS = 2

interface BookingFormProps {
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  initialDate: string
  initialTime: string
  initialPassengers: number
  initialLuggage: number
  user: any
  profile: any
  addonsByCategory: CheckoutAddonsByCategory[]
  currentStep: number
  direction: 1 | -1
  onGoNext: () => void
  onGoBack: () => void
  onExtrasChange?: (infantSeats: number, boosterSeats: number, luggage: number) => void
  onPassengersChange?: (passengers: number) => void
  onDateTimeChange?: (date: string, time: string) => void
  onAddonsChange?: (addons: OrderSummaryAddon[]) => void
  onFormReady?: (formMethods: {
    submit: () => void
    isSubmitting: boolean
    agreeToTerms: boolean
    setAgreeToTerms: (value: boolean) => void
    trigger: (fields: string[]) => Promise<boolean>
    handleContinue: () => void
  }) => void
}

export function BookingForm({
  route,
  vehicleType,
  initialDate,
  initialTime,
  initialPassengers,
  initialLuggage,
  user,
  profile,
  addonsByCategory,
  currentStep,
  direction,
  onGoNext,
  onGoBack,
  onExtrasChange,
  onPassengersChange,
  onDateTimeChange,
  onAddonsChange,
  onFormReady
}: BookingFormProps) {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [loading, setLoading] = useState(false)
  const [passengers, setPassengers] = useState(initialPassengers)
  const [luggage] = useState(initialLuggage)
  const [stepValidationAttempted, setStepValidationAttempted] = useState(false)

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: profile?.first_name || user?.user_metadata?.first_name || profile?.full_name?.split(' ')[0] || '',
      lastName: profile?.last_name || user?.user_metadata?.last_name || profile?.full_name?.split(' ').slice(1).join(' ') || '',
      email: user?.email || profile?.email || '',
      phone: profile?.phone || user?.user_metadata?.phone || '',
      pickupDate: initialDate,
      pickupTime: initialTime,
      infantSeats: 0,
      boosterSeats: 0,
      luggageCount: luggage,
      extraLuggageCount: Math.max(0, luggage - vehicleType.luggage_capacity),
      paymentMethod: 'card',
      agreeToTerms: false,
      selectedAddons: [],
    }
  })

  const { handleSubmit, watch, setValue, trigger, formState: { errors } } = form
  const agreeToTerms = watch('agreeToTerms')
  const infantSeats = watch('infantSeats')
  const boosterSeats = watch('boosterSeats')
  const watchedAddons = watch('selectedAddons')
  const selectedAddons = useMemo(() => watchedAddons || [], [watchedAddons])

  const basePrice = vehicleType.price || 50

  useEffect(() => {
    setStepValidationAttempted(false)
  }, [currentStep])

  useEffect(() => {
    if (onPassengersChange) {
      onPassengersChange(passengers)
    }
  }, [passengers, onPassengersChange])

  useEffect(() => {
    if (onExtrasChange) {
      onExtrasChange(infantSeats, boosterSeats, luggage)
    }
  }, [infantSeats, boosterSeats, luggage, onExtrasChange])

  useEffect(() => {
    if (onAddonsChange) {
      const addonsWithNames: OrderSummaryAddon[] = selectedAddons.map(addon => {
        const addonDetails = addonsByCategory
          .flatMap(c => c.addons)
          .find(a => a.id === addon.addon_id)
        return {
          id: addon.addon_id,
          name: addonDetails?.name || 'Service',
          quantity: addon.quantity,
          unit_price: addon.unit_price,
          total_price: addon.total_price
        }
      })
      onAddonsChange(addonsWithNames)
    }
  }, [selectedAddons, onAddonsChange, addonsByCategory])

  const onSubmit = useCallback(async (data: BookingFormData) => {
    setLoading(true)
    try {
      const result = await createBooking({
        vehicleTypeId: vehicleType.id,
        fromLocationId: route.origin.id,
        toLocationId: route.destination.id,
        pickupAddress: route.origin.name,
        dropoffAddress: route.destination.name,
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
        passengerCount: passengers,
        luggageCount: data.luggageCount,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        specialRequests: data.specialRequests,
        childSeats: {
          infant: data.infantSeats,
          booster: data.boosterSeats
        },
        extraLuggageCount: data.extraLuggageCount,
        basePrice: basePrice,
        agreeToTerms: data.agreeToTerms,
        paymentMethod: data.paymentMethod,
        selectedAddons: data.selectedAddons,
      })

      if (result.success) {
        router.push(buildPaymentUrl(result.bookingNumber))
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [vehicleType.id, route.origin.id, route.origin.name, route.destination.id, route.destination.name, passengers, basePrice, router])

  const handleContinue = useCallback(async () => {
    const fields = STEP_FIELDS[currentStep] || []
    if (fields.length > 0) {
      setStepValidationAttempted(true)
      const isValid = await trigger(fields)
      if (!isValid) return
    }
    onGoNext()
  }, [currentStep, trigger, onGoNext])

  const formMethodsRef = useRef({
    submit: handleSubmit(onSubmit),
    isSubmitting: loading,
    agreeToTerms,
    setAgreeToTerms: (value: boolean) => setValue('agreeToTerms', value),
    trigger: async (fields: string[]) => trigger(fields as (keyof BookingFormData)[]),
    handleContinue,
  })
  formMethodsRef.current = {
    submit: handleSubmit(onSubmit),
    isSubmitting: loading,
    agreeToTerms,
    setAgreeToTerms: (value: boolean) => setValue('agreeToTerms', value),
    trigger: async (fields: string[]) => trigger(fields as (keyof BookingFormData)[]),
    handleContinue,
  }

  useEffect(() => {
    if (onFormReady) {
      onFormReady({
        submit: (...args: []) => formMethodsRef.current.submit(...args),
        isSubmitting: loading,
        agreeToTerms,
        setAgreeToTerms: (value: boolean) => formMethodsRef.current.setAgreeToTerms(value),
        trigger: (fields: string[]) => formMethodsRef.current.trigger(fields),
        handleContinue: () => formMethodsRef.current.handleContinue(),
      })
    }
  }, [loading, agreeToTerms, onFormReady])

  const stepSections = [
    <div key="booking-details" className="space-y-0">
      <TransferDetailsSection
        form={form}
        route={route}
        vehicleType={vehicleType}
        passengers={passengers}
        setPassengers={setPassengers}
        onDateTimeChange={onDateTimeChange}
      />
      <PassengerInfoSection form={form} />
    </div>,
    <div key="services-pay" className="space-y-0">
      <AdditionalServicesSection
        form={form}
        vehicleType={vehicleType}
        addonsByCategory={addonsByCategory}
      />
      <PaymentMethodSection form={form} />
    </div>,
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentStep}
          initial={reduceMotion ? false : { opacity: 0, y: direction * 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: direction * -8 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {stepValidationAttempted && (
            <StepErrorSummary
              errors={errors}
              fieldNames={STEP_FIELDS[currentStep]?.map(String) || []}
            />
          )}

          {stepSections[currentStep]}

          <WizardNavigation
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            onBack={onGoBack}
            onContinue={handleContinue}
          />
        </motion.div>
      </AnimatePresence>
    </form>
  )
}

BookingForm.displayName = 'BookingForm'
