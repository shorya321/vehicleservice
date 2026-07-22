import { createAdminClient } from '@/lib/supabase/admin'
import { BOOKING_TIMEZONE } from '@/lib/utils/timezone'

import {
  BOOKING_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type DirectBookingPaymentMethod,
  type DirectBookingPaymentStatus,
  type DirectBookingStatus,
} from './schema'

/**
 * Hydration for direct-booking notification emails.
 *
 * None of the existing queries return what an email needs: the list select omits
 * driver phone and email, `getDirectBooking` is a bare `select('*')` with no
 * joins, and `assertFleetOwnership` deliberately selects only ids. This module
 * is the single place that assembles the full picture.
 *
 * Reads run through the admin client. The caller has already proved ownership by
 * the time it dispatches an email, and the vendor's own RLS grant does not cover
 * the `vendor_applications` row this joins for sender identity.
 *
 * Not a `'use server'` module — it exports types, which that directive forbids
 * at runtime while tsc stays silent (see the note in the actions file).
 */

/** Vendor identity, for emails sent in the vendor's voice rather than the platform's. */
export interface DirectBookingEmailVendor {
  businessName: string
  /** Nullable on `vendor_applications`; used as reply-to when present. */
  businessEmail: string | null
  /** Nullable; shown as the customer's callback number when present. */
  businessPhone: string | null
}

/**
 * Everything a direct-booking email may display.
 *
 * Deliberately excludes `internal_notes` and `cancellation_reason`. The form
 * promises the vendor "Only your team sees this", so those fields must not be
 * reachable from a customer-facing template — omitting them here makes passing
 * one a type error rather than a matter of care.
 *
 * Dates arrive pre-formatted in Asia/Dubai, matching the house convention that
 * templates never receive a `Date`.
 */
export interface DirectBookingEmailPayload {
  id: string
  reference: string
  status: DirectBookingStatus
  statusLabel: string

  customerName: string
  customerEmail: string | null
  customerPhone: string
  /** The customer's own request, safe to echo back. Never `internal_notes`. */
  customerNotes: string | null

  driverName: string
  driverEmail: string | null
  driverPhone: string | null

  /** e.g. `Toyota Land Cruiser (2023)`. */
  vehicleLabel: string
  vehicleRegistration: string

  pickupLocation: string
  dropoffLocation: string | null
  pickupDate: string
  pickupTime: string
  returnDate: string
  returnTime: string

  totalAmount: number
  amountPaid: number
  /** `total - paid`, floored at zero so a refunded row cannot render negative. */
  balanceDue: number
  currency: string
  paymentStatusLabel: string
  paymentMethodLabel: string | null

  vendor: DirectBookingEmailVendor

  /** Notification bookkeeping, for the caller's idempotency guards. */
  confirmationSentAt: string | null
  lastNotifiedStatus: string | null
}

const SELECT = `
  id,
  reference_number,
  booking_status,
  customer_name,
  customer_email,
  customer_phone,
  customer_notes,
  pickup_datetime,
  return_datetime,
  pickup_location,
  dropoff_location,
  total_price,
  amount_paid,
  currency,
  payment_status,
  payment_method,
  confirmation_sent_at,
  last_notified_status,
  vehicle:vehicles(make, model, year, registration_number),
  driver:vendor_drivers(first_name, last_name, phone, email),
  vendor:vendor_applications(business_name, business_email, business_phone)
`

/** Dubai wall-clock, matching how the payment flow formats dates for email. */
function formatDateTime(iso: string): { date: string; time: string } {
  const value = new Date(iso)

  return {
    date: value.toLocaleDateString('en-US', {
      timeZone: BOOKING_TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: value.toLocaleTimeString('en-US', {
      timeZone: BOOKING_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

/**
 * Loads one booking in the shape the email templates expect.
 *
 * Returns `null` rather than throwing when the row or a required relation is
 * missing. Callers dispatch email on a best-effort basis and must never let a
 * hydration failure surface as a booking failure.
 */
export async function getDirectBookingEmailPayload(
  id: string
): Promise<DirectBookingEmailPayload | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('vendor_direct_bookings')
    .select(SELECT)
    .eq('id', id)
    .single()

  if (error || !data) return null

  // Supabase types embedded relations as an array or an object depending on how
  // it infers the FK; normalise before reading.
  const vehicle = Array.isArray(data.vehicle) ? data.vehicle[0] : data.vehicle
  const driver = Array.isArray(data.driver) ? data.driver[0] : data.driver
  const vendor = Array.isArray(data.vendor) ? data.vendor[0] : data.vendor

  if (!vehicle || !driver || !vendor) return null

  const pickup = formatDateTime(data.pickup_datetime)
  const returnAt = formatDateTime(data.return_datetime)

  const totalAmount = Number(data.total_price)
  const amountPaid = Number(data.amount_paid)

  const paymentMethod = data.payment_method as DirectBookingPaymentMethod | null

  return {
    id: data.id,
    reference: data.reference_number,
    status: data.booking_status as DirectBookingStatus,
    statusLabel:
      BOOKING_STATUS_LABELS[data.booking_status as DirectBookingStatus] ??
      data.booking_status,

    customerName: data.customer_name,
    customerEmail: data.customer_email,
    customerPhone: data.customer_phone,
    customerNotes: data.customer_notes,

    driverName: [driver.first_name, driver.last_name].filter(Boolean).join(' '),
    driverEmail: driver.email,
    driverPhone: driver.phone,

    vehicleLabel: [vehicle.make, vehicle.model].filter(Boolean).join(' ') +
      (vehicle.year ? ` (${vehicle.year})` : ''),
    vehicleRegistration: vehicle.registration_number,

    pickupLocation: data.pickup_location,
    dropoffLocation: data.dropoff_location,
    pickupDate: pickup.date,
    pickupTime: pickup.time,
    returnDate: returnAt.date,
    returnTime: returnAt.time,

    totalAmount,
    amountPaid,
    // A refunded booking can carry amount_paid above nothing owed; never show a
    // negative balance.
    balanceDue: Math.max(0, totalAmount - amountPaid),
    currency: data.currency,
    paymentStatusLabel:
      PAYMENT_STATUS_LABELS[data.payment_status as DirectBookingPaymentStatus] ??
      data.payment_status,
    paymentMethodLabel: paymentMethod ? PAYMENT_METHOD_LABELS[paymentMethod] ?? null : null,

    vendor: {
      businessName: vendor.business_name,
      businessEmail: vendor.business_email,
      businessPhone: vendor.business_phone,
    },

    confirmationSentAt: data.confirmation_sent_at,
    lastNotifiedStatus: data.last_notified_status,
  }
}
