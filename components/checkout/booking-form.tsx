'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RouteDetails, VehicleTypeDetails, CheckoutAddonsByCategory, createBooking } from '@/app/checkout/actions'
import { OrderSummaryAddon } from './checkout-wrapper'
import { toast } from 'sonner'

// Import section components
import { TransferDetailsSection } from './form-sections/transfer-details-section'
import { PassengerInfoSection } from './form-sections/passenger-info-section'
import { AdditionalServicesSection } from './form-sections/additional-services-section'
import { PaymentMethodSection } from './form-sections/payment-method-section'

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
  onExtrasChange?: (infantSeats: number, boosterSeats: number, luggage: number) => void
  onDateTimeChange?: (date: string, time: string) => void
  onAddonsChange?: (addons: OrderSummaryAddon[]) => void
  onFormReady?: (formMethods: {
    submit: () => void
    isSubmitting: boolean
    agreeToTerms: boolean
    setAgreeToTerms: (value: boolean) => void
  }) => void
}

/**
 * Booking Form Orchestrator Component
 *
 * Manages the complete booking flow by:
 * - Initializing form state with user data
 * - Coordinating section components
 * - Handling form submission and booking creation
 * - Managing shared state (passengers, luggage)
 * - Calculating pricing with extras
 *
 * @component
 */
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
  onExtrasChange,
  onDateTimeChange,
  onAddonsChange,
  onFormReady
}: BookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [passengers, setPassengers] = useState(initialPassengers)
  const [luggage, setLuggage] = useState(initialLuggage)

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
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

  const { handleSubmit, watch, setValue } = form
  const agreeToTerms = watch('agreeToTerms')
  const infantSeats = watch('infantSeats')
  const boosterSeats = watch('boosterSeats')
  const selectedAddons = watch('selectedAddons') || []

  // Calculate total price with all extras
  const basePrice = vehicleType.price || 50
  const extraLuggageCount = Math.max(0, luggage - vehicleType.luggage_capacity)
  const extraLuggageCost = extraLuggageCount * 15
  const addonsCost = selectedAddons.reduce((sum, addon) => sum + addon.total_price, 0)
  const totalPrice = basePrice + extraLuggageCost + addonsCost

  // Notify parent of extras changes
  useEffect(() => {
    if (onExtrasChange) {
      onExtrasChange(infantSeats, boosterSeats, luggage)
    }
  }, [infantSeats, boosterSeats, luggage, onExtrasChange])

  // Notify parent of addons changes (with name lookup for display)
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

  // Expose form methods to parent
  useEffect(() => {
    if (onFormReady) {
      onFormReady({
        submit: handleSubmit(onSubmit),
        isSubmitting: loading,
        agreeToTerms,
        setAgreeToTerms: (value: boolean) => setValue('agreeToTerms', value)
      })
    }
  }, [loading, agreeToTerms])

  const onSubmit = async (data: BookingFormData) => {
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
        router.push(`/payment?booking=${result.bookingId}&amount=${result.totalPrice}`)
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Transfer Details */}
      <TransferDetailsSection
        form={form}
        route={route}
        vehicleType={vehicleType}
        passengers={passengers}
        setPassengers={setPassengers}
        onDateTimeChange={onDateTimeChange}
      />

      {/* Passenger Information */}
      <PassengerInfoSection form={form} />

      {/* Additional Services */}
      <AdditionalServicesSection
        form={form}
        vehicleType={vehicleType}
        addonsByCategory={addonsByCategory}
      />

      {/* Payment Method */}
      <PaymentMethodSection form={form} />

      {/* Hidden submit - actual submit is in OrderSummary on desktop */}
      <input type="submit" className="hidden" />
    </form>
  )
}

BookingForm.displayName = 'BookingForm'
