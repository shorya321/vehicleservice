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
import { phoneField } from '@/lib/validation/phone'
import { getSeatedCount, type GuestBreakdown } from '@/components/home/hero/guest-breakdown'

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
  // Nullable at the element level on purpose: a half-filled seat must still parse, so that the
  // friendlier array-level message below is what the customer sees rather than a raw type error.
  child_ages: z.array(z.number().int().min(0).max(12).nullable()).optional(),
  requires_child_age: z.boolean().optional(),
})

/**
 * The child-age rule lives on the ARRAY field, not on `bookingSchema`. An object-level `.refine()`
 * only runs once every field parses, and `agreeToTerms` is false until the customer ticks it, so a
 * schema-level refine would be skipped for the entire time the error actually needs to be visible.
 */
const selectedAddonsField = z
  .array(selectedAddonSchema)
  .superRefine((addons, ctx) => {
    for (const a of addons) {
      if (!a.requires_child_age) continue
      const ages = a.child_ages ?? []
      if (ages.length !== a.quantity || ages.some(v => v === null)) {
        // Empty path => the issue attaches to `selectedAddons` itself, which is what
        // StepErrorSummary reads (errors[name]?.message) and what trigger() targets.
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [],
          message: 'Select an age for each child seat',
        })
        return
      }
    }
  })
  .optional()

const bookingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: phoneField,
  pickupDate: z.string().min(1, 'Pickup date is required'),
  pickupTime: z.string().min(1, 'Pickup time is required'),
  flightNumber: z.string().optional(),
  specialRequests: z.string().optional(),
  luggageCount: z.number().min(0).max(50),
  extraLuggageCount: z.number().min(0),
  paymentMethod: z.enum(['card']),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
  selectedAddons: selectedAddonsField,
})

type BookingFormData = z.infer<typeof bookingSchema>

const STEP_FIELDS: Record<number, (keyof BookingFormData)[]> = {
  0: ['pickupDate', 'pickupTime', 'firstName', 'lastName', 'email', 'phone'],
  // `selectedAddons` carries the child-age rule, so it has to be gated here or a seat with a
  // missing age would sail through to the server and come back as a thrown error.
  1: ['paymentMethod', 'selectedAddons'],
}

const TOTAL_STEPS = 2

interface BookingFormProps {
  route: RouteDetails
  vehicleType: VehicleTypeDetails
  initialDate: string
  initialTime: string
  initialPassengers: number
  /** Adults/children/infants behind `initialPassengers`. Already clamped to the vehicle. */
  initialGuests: GuestBreakdown
  initialLuggage: number
  user: any
  profile: any
  addonsByCategory: CheckoutAddonsByCategory[]
  currentStep: number
  direction: 1 | -1
  onGoNext: () => void
  onGoBack: () => void
  onExtrasChange?: (luggage: number) => void
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
  initialGuests,
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
  // The breakdown is the source of truth; the total is always derived from it, so the two can never
  // contradict. `initialPassengers` is only the server-clamped seed for that derivation.
  const [guests, setGuests] = useState<GuestBreakdown>(initialGuests)
  const passengers = getSeatedCount(guests)
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
      luggageCount: luggage,
      extraLuggageCount: Math.max(0, luggage - vehicleType.luggage_capacity),
      paymentMethod: 'card',
      agreeToTerms: false,
      selectedAddons: [],
    }
  })

  const { handleSubmit, watch, setValue, trigger, formState: { errors } } = form
  const agreeToTerms = watch('agreeToTerms')
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
      onExtrasChange(luggage)
    }
  }, [luggage, onExtrasChange])

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
        adults: guests.adults,
        children: guests.children,
        infants: guests.infants,
        luggageCount: data.luggageCount,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        specialRequests: data.specialRequests,
        extraLuggageCount: data.extraLuggageCount,
        basePrice: basePrice,
        agreeToTerms: data.agreeToTerms,
        paymentMethod: data.paymentMethod,
        // Narrow to the server's contract: superRefine has already guaranteed every age is filled
        // in, and `requires_child_age` is a local rendering hint the server re-derives from the DB.
        selectedAddons: data.selectedAddons?.map(a => ({
          addon_id: a.addon_id,
          quantity: a.quantity,
          unit_price: a.unit_price,
          total_price: a.total_price,
          ...(a.child_ages
            ? { child_ages: a.child_ages.filter((v): v is number => v !== null) }
            : {}),
        })),
      })

      if (result.success) {
        router.push(buildPaymentUrl(result.bookingNumber))
      }
    } catch {
      toast.error('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
    // `guests` must be listed even though `passengers` is derived from it: the derivation is lossy.
    // Swapping an adult for a child leaves the seated total unchanged, so without `guests` here the
    // closure keeps a stale breakdown and posts the wrong adults/children/infants split.
  }, [vehicleType.id, route.origin.id, route.origin.name, route.destination.id, route.destination.name, passengers, guests, basePrice, router])

  const handleContinue = useCallback(async () => {
    const fields = STEP_FIELDS[currentStep] || []
    if (fields.length > 0) {
      setStepValidationAttempted(true)
      const isValid = await trigger(fields)
      if (!isValid) return
    }
    onGoNext()
  }, [currentStep, trigger, onGoNext])

  // Without an onInvalid handler a rejected submit does nothing at all. StepErrorSummary only
  // renders once `stepValidationAttempted` is set, which until now only "Continue" ever did. That
  // left both a missing child age and an unticked terms box failing silently on the final step.
  const onInvalid = useCallback(() => setStepValidationAttempted(true), [])

  const formMethodsRef = useRef({
    submit: handleSubmit(onSubmit, onInvalid),
    isSubmitting: loading,
    agreeToTerms,
    setAgreeToTerms: (value: boolean) => setValue('agreeToTerms', value),
    trigger: async (fields: string[]) => trigger(fields as (keyof BookingFormData)[]),
    handleContinue,
  })
  formMethodsRef.current = {
    submit: handleSubmit(onSubmit, onInvalid),
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

  const stepSections = useMemo(() => [
    <div key="booking-details">
      <TransferDetailsSection
        form={form}
        route={route}
        vehicleType={vehicleType}
        guests={guests}
        setGuests={setGuests}
        onDateTimeChange={onDateTimeChange}
      />
      <PassengerInfoSection form={form} />
    </div>,
    <div key="services-pay">
      <AdditionalServicesSection
        form={form}
        vehicleType={vehicleType}
        addonsByCategory={addonsByCategory}
        guests={guests}
      />
      <PaymentMethodSection form={form} />
    </div>,
  ], [form, route, vehicleType, guests, setGuests, onDateTimeChange, addonsByCategory])

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-0" aria-label="Booking form">
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
