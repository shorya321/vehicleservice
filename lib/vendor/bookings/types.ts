/**
 * Shapes returned by the vendor booking-detail fetch.
 *
 * These live here and not in `app/vendor/bookings/actions.ts` on purpose. That file is
 * `'use server'`, and a module with that directive may only export async functions. A type
 * exported from one compiles cleanly, then breaks the app at runtime on an unrelated route,
 * in a way `tsc --noEmit` will not surface. Same reasoning as
 * `lib/vendor/direct-bookings/types.ts`.
 */

import type { BookingType } from '@/lib/bookings/unified-service'

/**
 * One requested extra, normalised across the two tables that store them.
 *
 * Customer bookings keep these in `booking_amenities` (a `price` and a `quantity`), business
 * bookings in `business_booking_addons` (a `unit_price` and a `total_price`). The vendor
 * cares about neither number, only about what has to be in the car, so the merged shape
 * drops price entirely.
 */
export interface VendorBookingAddon {
  id: string
  name: string
  /** `addons.category`, e.g. "Child Safety", "Luggage", "Comfort". Null on legacy rows. */
  category: string | null
  /** Lucide icon name as stored in `addons.icon`, e.g. "Baby". Null on legacy rows. */
  icon: string | null
  quantity: number
  /** One age per seat, from `child_ages`. Null for everything that is not a child seat. */
  childAges: number[] | null
}

/** A passenger row. Customer bookings only; business bookings carry one inline contact. */
export interface VendorBookingPassenger {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  isPrimary: boolean
}

/**
 * A recorded pickup-time change.
 *
 * Business bookings only. The FK on `booking_datetime_modifications.booking_id` points at
 * `business_bookings` despite the column name.
 */
export interface VendorBookingReschedule {
  id: string
  previousDatetime: string
  newDatetime: string
  reason: string | null
  createdAt: string
}

/** The window this assignment holds its vehicle and driver for, from `resource_schedules`. */
export interface VendorAssignmentHold {
  startDatetime: string
  endDatetime: string
}

export interface VendorAssignedDriver {
  id: string
  firstName: string
  lastName: string
  phone: string
  licenseNumber: string
}

export interface VendorAssignedVehicle {
  id: string
  make: string
  model: string
  year: number
  registrationNumber: string
  seats: number | null
}

/**
 * Everything the vendor booking detail page renders.
 *
 * Deliberately omits `base_price`, `wallet_deduction_amount`, `applied_multiplier`, add-on
 * prices and payment status. Those are the client's commercials, and there is no commission
 * or payout model in this schema for the vendor side of them. `totalPrice` is kept only
 * because the assigned-bookings list already shows it.
 */
export interface VendorBookingDetail {
  /** `booking_assignments.id`. The route is keyed on this. */
  assignmentId: string
  assignmentStatus: string
  assignedAt: string
  acceptedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  completedAt: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  /** Set by admin when handing the job over, not by the vendor. */
  assignmentNotes: string | null
  estimatedDurationHours: number | null
  hold: VendorAssignmentHold | null
  driver: VendorAssignedDriver | null
  vehicle: VendorAssignedVehicle | null

  bookingId: string
  bookingType: BookingType
  bookingNumber: string
  tripNumber: string | null
  /** `business_bookings.reference_number`, e.g. a quotation reference. Business only. */
  referenceNumber: string | null
  bookingStatus: string
  /** The client company that placed the booking. Business only. */
  clientName: string | null

  pickupDatetime: string
  pickupAddress: string
  dropoffAddress: string
  fromLocationName: string | null
  toLocationName: string | null

  adults: number
  children: number
  infants: number
  passengerCount: number
  /** Not stored on `business_bookings`, so null for every business booking. */
  luggageCount: number | null

  vehicleTypeName: string | null
  vehicleTypeCategory: string | null
  vehicleTypePassengerCapacity: number | null
  vehicleTypeLuggageCapacity: number | null

  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  customerNotes: string | null

  addons: VendorBookingAddon[]
  passengers: VendorBookingPassenger[]
  reschedules: VendorBookingReschedule[]

  totalPrice: number

  /**
   * Still awaiting this vendor with its departure already behind us. Derived server-side:
   * reading the clock during render is impure, and a browser clock could disagree with the
   * availability answer this explains.
   */
  pickupHasPassed: boolean
}

/**
 * What the detail fetch answers with.
 *
 * `redirect` carries the canonical assignment id for a legacy booking-id URL. The page turns
 * it into a real redirect; the action stays free of routing side effects.
 */
export type VendorBookingDetailResult =
  | { status: 'ok'; detail: VendorBookingDetail }
  | { status: 'redirect'; assignmentId: string }
  | { status: 'not_found' }
