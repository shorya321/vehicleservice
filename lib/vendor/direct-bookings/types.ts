/**
 * Row shapes returned by the direct-booking server actions.
 *
 * These deliberately live here rather than in `app/vendor/direct-bookings/actions.ts`.
 * A `'use server'` module may only export async functions — exporting a type from
 * one compiles cleanly but breaks the app at runtime, on an unrelated route, in a
 * way `tsc --noEmit` will not surface.
 */

export interface DirectBookingRow {
  id: string
  reference_number: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  pickup_datetime: string
  return_datetime: string | null
  pickup_location: string
  dropoff_location: string | null
  total_price: number
  amount_paid: number
  currency: string
  payment_status: string
  payment_method: string | null
  booking_status: string
  vehicle: {
    id: string
    make: string
    model: string
    registration_number: string
  } | null
  driver: {
    id: string
    first_name: string
    last_name: string
  } | null
}

export interface VendorFleetVehicle {
  id: string
  make: string
  model: string
  year: number | null
  registration_number: string
}

export interface VendorFleetDriver {
  id: string
  first_name: string
  last_name: string
  phone: string
}

export interface VendorFleetOptions {
  vehicles: VendorFleetVehicle[]
  drivers: VendorFleetDriver[]
}

export interface DirectBookingStats {
  total: number
  pending: number
  completed: number
  today: number
  unpaid: number
}

export type DirectBookingActionResult = {
  success?: boolean
  error?: string
  id?: string
}
