import "server-only"
import type { createAdminClient } from "@/lib/supabase/admin"
import { cancellationRefundDue, roundMoney } from "@/lib/trips/pricing"
import { formatBookingDate, formatBookingTime } from "@/lib/utils/timezone"
import { tripAssignmentLabel } from "@/lib/trips/display"
import { sendBookingCancelledEmail } from "@/lib/email/services/booking-emails"
import { sendAdminBookingCancelledEmail } from "@/lib/email/services/admin-emails"
import { getAdminEmail, getAppUrl } from "@/lib/email/config"

type AdminClient = ReturnType<typeof createAdminClient>

export interface CancellableBooking {
  id: string
  customer_id: string | null
  booking_number: string
  trip_number: string | null
  pickup_address: string
  dropoff_address: string
  pickup_datetime: string
  payment_status: string | null
  total_price: number
  discount_amount: number | null
  booking_group_id: string | null
  trip_type: string | null
  hourly_package: string | null
  duration_hours: number | null
  included_km: number | null
  leg_index: number | null
}

export interface RefundOutcome {
  /** AED owed back to the card, or null when nothing was paid. */
  refundDue: number | null
  groupNumber: string | null
  legCount: number | null
  discountForfeited: boolean
}

/**
 * What cancelling this booking owes the customer, worked out before it is cancelled.
 *
 * A booking on its own refunds what was paid for it. One journey of a paid trip refunds its
 * share less the round-trip saving the rest of the trip no longer qualifies for (see
 * `cancellationRefundDue`). Refunds are issued by hand in Stripe; this only records the amount.
 */
export async function refundForCancellation(adminClient: AdminClient, booking: CancellableBooking): Promise<RefundOutcome> {
  if (!booking.booking_group_id) {
    return {
      refundDue: booking.payment_status === "completed" ? roundMoney(Number(booking.total_price)) : null,
      groupNumber: null,
      legCount: null,
      discountForfeited: false,
    }
  }

  const [{ data: group }, { data: legs }] = await Promise.all([
    adminClient.from("booking_groups").select("group_number, payment_status, leg_count").eq("id", booking.booking_group_id).single(),
    adminClient
      .from("bookings")
      .select("id, total_price, discount_amount, booking_status, refund_due")
      .eq("booking_group_id", booking.booking_group_id)
      .order("leg_index", { ascending: true }),
  ])

  const legRows = legs ?? []
  const index = legRows.findIndex((leg) => leg.id === booking.id)
  const paid = group?.payment_status === "completed"
  const anyDiscountStillApplied = legRows.some(
    (leg) => leg.id !== booking.id && leg.booking_status !== "cancelled" && Number(leg.discount_amount ?? 0) > 0
  )
  const alreadyForfeited = legRows.some((leg) => leg.id !== booking.id && leg.booking_status === "cancelled")

  return {
    refundDue:
      paid && index !== -1
        ? cancellationRefundDue(
            legRows.map((leg) => ({
              total: Number(leg.total_price),
              discount: Number(leg.discount_amount ?? 0),
              cancelled: leg.booking_status === "cancelled",
              refundDue: leg.refund_due != null ? Number(leg.refund_due) : null,
            })),
            index
          )
        : null,
    groupNumber: group?.group_number ?? null,
    legCount: group?.leg_count ?? legRows.length,
    discountForfeited: paid && anyDiscountStillApplied && !alreadyForfeited,
  }
}

/** Once every journey of a trip is cancelled, the trip itself reads as cancelled. */
export async function syncGroupAfterCancellation(adminClient: AdminClient, groupId: string): Promise<void> {
  const { data: legs } = await adminClient.from("bookings").select("booking_status").eq("booking_group_id", groupId)
  if (legs && legs.length > 0 && legs.every((leg) => leg.booking_status === "cancelled")) {
    const { error } = await adminClient
      .from("booking_groups")
      .update({ booking_status: "cancelled" })
      .eq("id", groupId)
    if (error) console.error("Failed to mark trip cancelled:", error)
  }
}

/** Customer and admin cancellation notices. Never throws: a failed email must not undo a cancellation. */
export async function sendCancellationEmails(
  adminClient: AdminClient,
  booking: CancellableBooking,
  outcome: RefundOutcome,
  fallbackEmail?: string
): Promise<void> {
  try {
    const [{ data: passenger }, { data: profile }] = await Promise.all([
      adminClient
        .from("booking_passengers")
        .select("first_name, last_name, email")
        .eq("booking_id", booking.id)
        .eq("is_primary", true)
        .maybeSingle(),
      booking.customer_id
        ? adminClient.from("profiles").select("full_name, email").eq("id", booking.customer_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    const customerName = passenger ? `${passenger.first_name} ${passenger.last_name}` : profile?.full_name || "Customer"
    const customerEmail = passenger?.email || profile?.email || fallbackEmail || ""
    const common = {
      customerName,
      bookingReference: booking.booking_number,
      tripNumber: booking.trip_number ?? undefined,
      pickupLocation: booking.pickup_address,
      dropoffLocation: booking.dropoff_address,
      pickupDate: formatBookingDate(booking.pickup_datetime, "EEEE, MMMM d, yyyy"),
      pickupTime: formatBookingTime(booking.pickup_datetime, "hh:mm a"),
      refundDue: outcome.refundDue,
      tripLabel: tripAssignmentLabel(booking, outcome.legCount) ?? undefined,
      groupNumber: outcome.groupNumber ?? undefined,
      discountForfeited: outcome.discountForfeited,
    }

    await Promise.allSettled([
      customerEmail ? sendBookingCancelledEmail({ ...common, customerEmail }) : Promise.resolve(),
      sendAdminBookingCancelledEmail({
        ...common,
        adminEmail: getAdminEmail(),
        customerEmail: customerEmail || "Not provided",
        bookingDetailsUrl: `${getAppUrl()}/admin/bookings/${booking.id}`,
      }),
    ])
  } catch (error) {
    console.error("Failed to send cancellation emails:", error)
  }
}
