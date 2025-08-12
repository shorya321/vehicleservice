'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Baby,
  Luggage,
  CreditCard,
  Banknote,
  Info
} from 'lucide-react'
import { RouteDetails, VehicleTypeDetails, createBooking } from '@/app/checkout/actions'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

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
  extraLuggage: z.boolean(),
  paymentMethod: z.enum(['card', 'cash']),
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
  user: any
  profile: any
}

export function BookingForm({ 
  route, 
  vehicleType, 
  initialDate, 
  initialTime, 
  initialPassengers,
  user,
  profile
}: BookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [passengers, setPassengers] = useState(initialPassengers)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<BookingFormData>({
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
      extraLuggage: false,
      paymentMethod: 'card',
      agreeToTerms: false
    }
  })

  const paymentMethod = watch('paymentMethod')
  const agreeToTerms = watch('agreeToTerms')

  const onSubmit = async (data: BookingFormData) => {
    setLoading(true)
    try {
      const result = await createBooking({
        routeId: route.id,
        vehicleTypeId: vehicleType.id,
        pickupAddress: route.origin.name,
        dropoffAddress: route.destination.name,
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
        passengerCount: passengers,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        specialRequests: data.specialRequests,
        childSeats: {
          infant: data.infantSeats,
          booster: data.boosterSeats
        },
        extraLuggage: data.extraLuggage,
        agreeToTerms: data.agreeToTerms,
        paymentMethod: data.paymentMethod
      })

      if (result.success) {
        toast.success('Booking created successfully!')
        
        // Redirect based on payment method
        if (data.paymentMethod === 'card') {
          // Redirect to payment page
          router.push(`/payment?booking=${result.bookingId}&amount=${result.totalPrice}`)
        } else {
          // Redirect to confirmation page
          router.push(`/booking/confirmation?booking=${result.bookingNumber}`)
        }
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
      <Card>
        <CardHeader>
          <CardTitle>Transfer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Route Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                Pickup Location
              </Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{route.origin.name}</p>
                {route.origin.city && (
                  <p className="text-sm text-muted-foreground">{route.origin.city}</p>
                )}
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                Drop-off Location
              </Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{route.destination.name}</p>
                {route.destination.city && (
                  <p className="text-sm text-muted-foreground">{route.destination.city}</p>
                )}
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pickupDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Pickup Date
              </Label>
              <Input
                id="pickupDate"
                type="date"
                {...register('pickupDate')}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.pickupDate && (
                <p className="text-sm text-red-500 mt-1">{errors.pickupDate.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="pickupTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pickup Time
              </Label>
              <Input
                id="pickupTime"
                type="time"
                {...register('pickupTime')}
              />
              {errors.pickupTime && (
                <p className="text-sm text-red-500 mt-1">{errors.pickupTime.message}</p>
              )}
            </div>
          </div>

          {/* Flight Number (Optional) */}
          <div>
            <Label htmlFor="flightNumber">
              Flight Number (Optional)
            </Label>
            <Input
              id="flightNumber"
              placeholder="e.g., AA123"
              {...register('flightNumber')}
            />
          </div>

          {/* Passengers */}
          <div>
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Number of Passengers
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                disabled={passengers <= 1}
              >
                -
              </Button>
              <span className="w-12 text-center font-medium">{passengers}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPassengers(Math.min(vehicleType.passenger_capacity, passengers + 1))}
                disabled={passengers >= vehicleType.passenger_capacity}
              >
                +
              </Button>
              <span className="text-sm text-muted-foreground ml-2">
                Max: {vehicleType.passenger_capacity}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passenger Information */}
      <Card>
        <CardHeader>
          <CardTitle>Passenger Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="+1 234 567 8900"
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Services */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Child Seats */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Baby className="h-4 w-4" />
              Child Seats
            </Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Infant Seat (0-1 year)</p>
                  <p className="text-sm text-muted-foreground">+{formatCurrency(10)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = watch('infantSeats')
                      setValue('infantSeats', Math.max(0, current - 1))
                    }}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{watch('infantSeats')}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = watch('infantSeats')
                      setValue('infantSeats', Math.min(4, current + 1))
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Booster Seat (1-4 years)</p>
                  <p className="text-sm text-muted-foreground">+{formatCurrency(10)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = watch('boosterSeats')
                      setValue('boosterSeats', Math.max(0, current - 1))
                    }}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{watch('boosterSeats')}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = watch('boosterSeats')
                      setValue('boosterSeats', Math.min(4, current + 1))
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Extra Luggage */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Luggage className="h-5 w-5" />
              <div>
                <p className="font-medium">Extra Luggage</p>
                <p className="text-sm text-muted-foreground">+{formatCurrency(15)}</p>
              </div>
            </div>
            <Checkbox
              checked={watch('extraLuggage')}
              onCheckedChange={(checked) => setValue('extraLuggage', checked as boolean)}
            />
          </div>

          {/* Special Requests */}
          <div>
            <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
            <Textarea
              id="specialRequests"
              {...register('specialRequests')}
              placeholder="Any special requirements or requests..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => setValue('paymentMethod', value as 'card' | 'cash')}
          >
            <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="h-5 w-5" />
                <div>
                  <p className="font-medium">Pay by Card</p>
                  <p className="text-sm text-muted-foreground">Secure online payment</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                <Banknote className="h-5 w-5" />
                <div>
                  <p className="font-medium">Pay Cash to Driver</p>
                  <p className="text-sm text-muted-foreground">Pay when you meet your driver</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setValue('agreeToTerms', checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                  I agree to the Terms and Conditions *
                </Label>
                <p className="text-sm text-muted-foreground">
                  By booking, you agree to our terms of service and cancellation policy
                </p>
              </div>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-red-500">{errors.agreeToTerms.message}</p>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Free Cancellation
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Cancel up to 24 hours before pickup for a full refund
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loading || !agreeToTerms}
      >
        {loading ? 'Processing...' : paymentMethod === 'card' ? 'Continue to Payment' : 'Confirm Booking'}
      </Button>
    </form>
  )
}