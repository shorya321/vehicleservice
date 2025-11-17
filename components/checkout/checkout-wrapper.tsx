'use client'

import { useState } from 'react'
import { BookingForm } from './booking-form'
import { OrderSummary } from './order-summary'
import { RouteDetails, VehicleTypeDetails } from '@/app/checkout/actions'

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

  const handleExtrasChange = (infant: number, booster: number, luggage: number) => {
    setInfantSeats(infant)
    setBoosterSeats(booster)
    setCurrentLuggage(luggage)
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Booking Form - 2 columns on desktop */}
      <div className="lg:col-span-2">
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
        />
      </div>

      {/* Order Summary - 1 column on desktop, sticky */}
      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <OrderSummary
            route={route}
            vehicleType={vehicleType}
            passengers={initialPassengers}
            luggage={currentLuggage}
            infantSeats={infantSeats}
            boosterSeats={boosterSeats}
          />
        </div>
      </div>
    </div>
  )
}