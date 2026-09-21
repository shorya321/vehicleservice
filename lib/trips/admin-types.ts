/**
 * The trip a round-trip or multi-city journey belongs to, as the admin booking
 * page shows it. Kept out of the 'use server' actions file, which may only
 * export async functions.
 */
export interface AdminTripLeg {
  id: string
  booking_number: string
  trip_number: string | null
  leg_index: number
  pickup_address: string
  dropoff_address: string
  pickup_datetime: string
  booking_status: string
  payment_status: string | null
  /** This journey's share of the group charge. */
  total_price: number
  discount_amount: number
  /** Set when the journey was cancelled: what the customer is owed back (refunded by hand). */
  refund_due: number | null
  assignment_status: string | null
  vendor_name: string | null
}

export interface AdminTripGroup {
  id: string
  group_number: string
  trip_type: string
  leg_count: number
  subtotal: number
  discount_percent: number
  discount_amount: number
  total_price: number
  payment_status: string
  booking_status: string
  paid_at: string | null
  stripe_payment_intent_id: string | null
  legs: AdminTripLeg[]
}
