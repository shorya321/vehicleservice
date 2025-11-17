'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RouteDetails, VehicleTypeDetails, createBooking } from '@/app/checkout/actions'
import { toast } from 'sonner'

// Import section components
import { TransferDetailsSection } from './form-sections/transfer-details-section'
import { PassengerInfoSection } from './form-sections/passenger-info-section'
import { AdditionalServicesSection } from './form-sections/additional-services-section'
import { PaymentMethodSection } from './form-sections/payment-method-section'
import { TermsConditionsSection } from './form-sections/terms-conditions-section'

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
  })
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
  onExtrasChange?: (infantSeats: number, boosterSeats: number, luggage: number) => void
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
  onExtrasChange
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
      agreeToTerms: false
    }
  })

  const { handleSubmit, watch } = form
  const agreeToTerms = watch('agreeToTerms')
  const infantSeats = watch('infantSeats')
  const boosterSeats = watch('boosterSeats')

  // Calculate total price with all extras
  const basePrice = vehicleType.price || 50
  const extraLuggageCount = Math.max(0, luggage - vehicleType.luggage_capacity)
  const childSeatsCost = (infantSeats + boosterSeats) * 10
  const extraLuggageCost = extraLuggageCount * 15
  const totalPrice = basePrice + childSeatsCost + extraLuggageCost

  // Notify parent of changes
  useEffect(() => {
    if (onExtrasChange) {
      onExtrasChange(infantSeats, boosterSeats, luggage)
    }
  }, [infantSeats, boosterSeats, luggage, onExtrasChange])

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
        paymentMethod: data.paymentMethod
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Transfer Details */}
      <TransferDetailsSection
        form={form}
        route={route}
        vehicleType={vehicleType}
        passengers={passengers}
        setPassengers={setPassengers}
      />

      <Separator className="border-luxury-gold/20" />

      {/* Passenger Information */}
      <PassengerInfoSection form={form} />

      <Separator className="border-luxury-gold/20" />

      {/* Additional Services */}
      <AdditionalServicesSection
        form={form}
        vehicleType={vehicleType}
        luggage={luggage}
        setLuggage={setLuggage}
      />

      <Separator className="border-luxury-gold/20" />

      {/* Payment Method */}
      <PaymentMethodSection form={form} />

      <Separator className="border-luxury-gold/20" />

      {/* Terms and Conditions */}
      <TermsConditionsSection form={form} />

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Button
          type="submit"
          size="lg"
          className="w-full h-14 bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black font-sans uppercase tracking-wider font-semibold transition-all duration-300 active:scale-95"
          disabled={loading || !agreeToTerms}
        >
          {loading ? 'Processing...' : 'Continue to Payment'}
        </Button>
      </motion.div>
    </form>
  )
}

BookingForm.displayName = 'BookingForm'
