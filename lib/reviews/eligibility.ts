/**
 * Who may review which trip. One rule, shared by the Reviews tab list and the
 * submit action, and mirrored by the reviews INSERT policy in the database.
 *
 * booking_status rarely reaches "completed" (a vendor has to close the job), so
 * a trip counts as travelled once its pickup time has passed. Paid means
 * payment_status "completed". A round trip or multi-city trip is reviewed once,
 * on its first journey (leg_index 0).
 */

export interface ReviewableBooking {
  customer_id: string | null
  booking_status: string | null
  payment_status: string | null
  pickup_datetime: string | null
  booking_group_id: string | null
  leg_index: number | null
}

export interface ReviewEligibility {
  can: boolean
  reason?: string
}

export function isReviewEligible(
  booking: ReviewableBooking,
  userId: string,
  now: Date = new Date()
): ReviewEligibility {
  if (!booking.customer_id || booking.customer_id !== userId) {
    return { can: false, reason: "You can only review your own trips" }
  }
  if (booking.booking_status === "cancelled") {
    return { can: false, reason: "A cancelled trip cannot be reviewed" }
  }
  if (booking.payment_status !== "completed") {
    return { can: false, reason: "This trip can be reviewed once it is paid" }
  }

  const pickup = booking.pickup_datetime ? Date.parse(booking.pickup_datetime) : NaN
  if (Number.isNaN(pickup) || pickup >= now.getTime()) {
    return { can: false, reason: "This trip can be reviewed after the pickup time" }
  }

  if (booking.booking_group_id && booking.leg_index !== 0) {
    return { can: false, reason: "This trip is reviewed on its first journey" }
  }

  return { can: true }
}
