import * as z from 'zod'

import { phoneField } from '@/lib/validation/phone'

/**
 * Shared between the vendor form and the server actions, following the
 * `lib/vehicles/schema.ts` precedent — the drivers module validates only on the
 * client and reads raw FormData on the server, which is the pattern to avoid.
 */

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
] as const

/**
 * Statuses in which a booking still holds its vehicle and driver.
 *
 * The complement — cancelled and completed — releases them. Kept as an explicit
 * allow-list rather than a NOT IN so the intent is stated positively and a status
 * added later cannot silently start occupying resources. Mirrors the
 * `booking_status NOT IN ('cancelled','completed')` predicate on the database's
 * exclusion constraints.
 */
export const OCCUPYING_BOOKING_STATUSES = ['pending', 'confirmed', 'in_progress'] as const

export const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid', 'refunded'] as const

export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'card', 'other'] as const

export type DirectBookingStatus = (typeof BOOKING_STATUSES)[number]
export type DirectBookingPaymentStatus = (typeof PAYMENT_STATUSES)[number]
export type DirectBookingPaymentMethod = (typeof PAYMENT_METHODS)[number]

export const BOOKING_STATUS_LABELS: Record<DirectBookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const PAYMENT_STATUS_LABELS: Record<DirectBookingPaymentStatus, string> = {
  unpaid: 'Unpaid',
  partial: 'Partially Paid',
  paid: 'Paid',
  refunded: 'Refunded',
}

export const PAYMENT_METHOD_LABELS: Record<DirectBookingPaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  other: 'Other',
}

/** `yyyy-MM-dd`, kept as a string so it survives the Server Action boundary. */
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid date')

/** `HH:mm`, matching what FormTimePicker emits. */
const timeField = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Select a valid time')

const optionalText = z
  .string()
  .trim()
  .max(2000, 'Too long')
  .optional()
  .or(z.literal(''))

/**
 * Date and time are separate fields because the project has no combined
 * datetime picker — the checkout and business flows both pair FormDatePicker
 * with FormTimePicker. They are joined and converted from Asia/Dubai wall-clock
 * to UTC in the server action, never here.
 */
export const directBookingFormSchema = z
  .object({
    customer_name: z.string().trim().min(2, 'Customer name is required'),
    customer_phone: phoneField,
    // Required: the confirmation email is the point of this module, and a booking
    // saved without an address leaves the customer silently uncontacted.
    // `.min(1)` runs first so a blank field reads "required" rather than "invalid".
    customer_email: z
      .string()
      .trim()
      .min(1, 'Customer email is required')
      .email('Enter a valid email'),
    customer_notes: optionalText,

    vehicle_id: z.string().uuid('Select a vehicle'),
    // Required as of the conflict-detection work: a booking with no driver cannot
    // reserve one, so the driver's time could be double-sold.
    driver_id: z.string().uuid('Select a driver'),

    // Return is required too — without a guaranteed end time the booking has no
    // window, and overlap cannot be computed against it.
    pickup_date: dateField,
    pickup_time: timeField,
    return_date: dateField,
    return_time: timeField,

    pickup_location: z.string().trim().min(2, 'Pickup location is required'),
    dropoff_location: optionalText,

    total_price: z
      .number({ message: 'Enter a price' })
      .min(0, 'Price cannot be negative')
      .max(1_000_000, 'Price looks too large'),
    amount_paid: z
      .number({ message: 'Enter an amount' })
      .min(0, 'Amount cannot be negative')
      .max(1_000_000, 'Amount looks too large'),

    payment_status: z.enum(PAYMENT_STATUSES),
    payment_method: z.enum(PAYMENT_METHODS).optional().or(z.literal('')),

    booking_status: z.enum(BOOKING_STATUSES),
    cancellation_reason: optionalText,

    internal_notes: optionalText,
  })
  // Mirrors the DB CHECK constraints so the vendor sees a field-level message
  // instead of a raw Postgres error.
  .refine((d) => d.amount_paid <= d.total_price, {
    message: 'Amount paid cannot exceed the total price',
    path: ['amount_paid'],
  })
  .refine((d) => d.payment_status !== 'paid' || d.amount_paid === d.total_price, {
    message: 'Mark as paid only when the full amount has been collected',
    path: ['amount_paid'],
  })
  .refine((d) => d.payment_status !== 'unpaid' || d.amount_paid === 0, {
    message: 'Unpaid bookings cannot have an amount collected',
    path: ['amount_paid'],
  })
  .refine(
    (d) => d.booking_status !== 'cancelled' || !!d.cancellation_reason?.trim(),
    {
      message: 'Give a reason when cancelling',
      path: ['cancellation_reason'],
    }
  )
  // Lexicographic comparison is safe here: both sides are fixed-width
  // `yyyy-MM-ddTHH:mm` in the same timezone.
  .refine(
    (d) => `${d.return_date}T${d.return_time}` > `${d.pickup_date}T${d.pickup_time}`,
    {
      message: 'Return must be after pickup',
      path: ['return_date'],
    }
  )

export type DirectBookingFormValues = z.infer<typeof directBookingFormSchema>

/**
 * The server parses this same shape. `vendor_id` is deliberately absent — it is
 * resolved from the session, never accepted from the client.
 */
export const directBookingMutationSchema = directBookingFormSchema

export type DirectBookingMutationInput = z.infer<typeof directBookingMutationSchema>

/** Filters accepted by the list query. Applied in SQL, not in JS. */
export interface DirectBookingFilters {
  search?: string
  status?: DirectBookingStatus | 'all'
  paymentStatus?: DirectBookingPaymentStatus | 'all'
  from?: string
  to?: string
  page?: number
  limit?: number
}

/** Flattens a ZodError into the first message, for toasting. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid booking details'
}
