import "server-only"
import type { createAdminClient } from "@/lib/supabase/admin"
import { legLabel } from "@/lib/trips/display"

type AdminClient = ReturnType<typeof createAdminClient>

export interface AccountTripLeg {
  id: string
  reference: string
  label: string
  pickup_address: string
  dropoff_address: string
  pickup_datetime: string
  booking_status: string
  total_price: number
  refund_due: number | null
}

export interface AccountTripGroup {
  group_number: string
  trip_type: string
  total_price: number
  discount_amount: number
  payment_status: string
  legs: AccountTripLeg[]
}

/** The trip a journey belongs to, for the account booking page. Ownership is checked by the caller. */
export async function loadAccountTripGroup(adminClient: AdminClient, groupId: string): Promise<AccountTripGroup | null> {
  const [{ data: group }, { data: legs }] = await Promise.all([
    adminClient
      .from("booking_groups")
      .select("group_number, trip_type, total_price, discount_amount, payment_status")
      .eq("id", groupId)
      .single(),
    adminClient
      .from("bookings")
      .select("id, booking_number, trip_number, trip_type, leg_index, pickup_address, dropoff_address, pickup_datetime, booking_status, total_price, refund_due")
      .eq("booking_group_id", groupId)
      .order("leg_index", { ascending: true }),
  ])
  if (!group || !legs) return null

  return {
    group_number: group.group_number,
    trip_type: group.trip_type,
    total_price: Number(group.total_price),
    discount_amount: Number(group.discount_amount),
    payment_status: group.payment_status,
    legs: legs.map((leg) => ({
      id: leg.id,
      reference: leg.trip_number || leg.booking_number,
      label: legLabel(leg, legs.length) ?? "Journey",
      pickup_address: leg.pickup_address,
      dropoff_address: leg.dropoff_address,
      pickup_datetime: leg.pickup_datetime,
      booking_status: leg.booking_status,
      total_price: Number(leg.total_price),
      refund_due: leg.refund_due != null ? Number(leg.refund_due) : null,
    })),
  }
}
