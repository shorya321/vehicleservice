'use client'

import { useState, useCallback } from 'react'
import { BookingForm } from './booking-form'
import { OrderSummary } from './order-summary'
import { RouteDetails, VehicleTypeDetails } from '@/app/checkout/actions'

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
}

export function CheckoutWrapper({
  route,
  vehicleType,
  initialDate,
  initialTime,
  initialPassengers,
  initialLuggage,
  user,
  profile
}: CheckoutWrapperProps) {
  const [infantSeats, setInfantSeats] = useState(0)
  const [boosterSeats, setBoosterSeats] = useState(0)
  const [currentLuggage, setCurrentLuggage] = useState(initialLuggage)
  const [pickupDate, setPickupDate] = useState(initialDate)
  const [pickupTime, setPickupTime] = useState(initialTime)

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

  const handleFormReady = useCallback((methods: FormMethods) => {
    setFormMethods(methods)
  }, [])

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-start">
      {/* Main Booking Form */}
      <div>
        <BookingForm
          route={route}
          vehicleType={vehicleType}
          initialDate={initialDate}
          initialTime={initialTime}
          initialPassengers={initialPassengers}
          initialLuggage={initialLuggage}
          user={user}
          profile={profile}
          onExtrasChange={handleExtrasChange}
          onDateTimeChange={handleDateTimeChange}
          onFormReady={handleFormReady}
        />
      </div>

      {/* Order Summary Sidebar - Sticky */}
      <div className="lg:sticky lg:top-24">
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
        />
      </div>
    </div>
  )
}
