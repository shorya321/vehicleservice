"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * The overview tab's data.
 *
 * The account used to open on the personal-details form, so the one thing a transfer customer
 * comes here for — when the car arrives and who is driving — sat three tabs away inside Bookings.
 * This is what the overview needs to answer that in one screen, in one round trip.
 *
 * Every query runs on the admin client, the way getBookings and getBookingStats already do, so
 * `userId` is checked against the session rather than trusted: this is a server action and is
 * reachable by anyone holding a session.
 */

/** The shape the overview renders. Deliberately narrow: no `select("*")` leaking into the client. */
export interface NextTransfer {
  id: string
  booking_number: string
  trip_number: string | null
  pickup_address: string
  dropoff_address: string
  pickup_datetime: string
  booking_status: string
  payment_status: string
  total_price: number
  currency: string
  passenger_count: number | null
  vehicle_type: { name: string } | null
  trip_type: string | null
  hourly_package: string | null
  duration_hours: number | null
  leg_index: number | null
  /** Present once a vendor has assigned a car and a chauffeur. Null until then. */
  driver_name: string | null
  vendor_name: string | null
}

export interface OverviewCounts {
  /** Every booking on the account, cancelled ones included. */
  total: number
  /** Still ahead of the customer: pickup in the future and not cancelled. */
  upcoming: number
  /**
   * Already travelled, measured by the clock rather than by `booking_status`.
   *
   * `booking_status` is only moved to "completed" by a vendor closing the job, which in practice
   * often does not happen, so counting that column reported "0 travelled" to a customer looking
   * at three past trips. A pickup in the past that was never cancelled has been travelled.
   */
  travelled: number
  cancelled: number
}

export interface AccountOverview {
  /**
   * The instant every figure here was measured against, as an ISO string.
   *
   * It travels with the data so the client can say "cancel free until Friday" without reading
   * its own clock during render: a `Date.now()` in a render body gives the server and the
   * browser two different answers and makes the markup non-deterministic.
   */
  asOf: string
  nextTransfer: NextTransfer | null
  counts: OverviewCounts
  /**
   * Lifetime spend, and the currency it is expressed in. Null when the account holds bookings in
   * more than one currency: adding AED to EUR would print a number that means nothing, and this
   * page has no live rate to convert with.
   */
  spend: { amount: number; currency: string } | null
}

const emptyOverview = (asOf: string): AccountOverview => ({
  asOf,
  nextTransfer: null,
  counts: { total: 0, upcoming: 0, travelled: 0, cancelled: 0 },
  spend: null,
})

/** A booking that was cancelled is neither upcoming, travelled, nor money spent. */
const CANCELLED = "cancelled"

export async function getAccountOverview(userId: string): Promise<AccountOverview> {
  const nowIso = new Date().toISOString()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return emptyOverview(nowIso)
  }

  const adminClient = createAdminClient()

  const [nextRow, statusRows] = await Promise.all([
    adminClient
      .from("bookings")
      .select(`
        id,
        booking_number,
        trip_number,
        pickup_address,
        dropoff_address,
        pickup_datetime,
        booking_status,
        payment_status,
        total_price,
        currency,
        passenger_count,
        trip_type,
        hourly_package,
        duration_hours,
        leg_index,
        vehicle_type:vehicle_types(name),
        booking_assignments (
          status,
          vendor:vendor_applications (business_name),
          driver:vendor_drivers (first_name, last_name)
        )
      `)
      .eq("customer_id", userId)
      .neq("booking_status", CANCELLED)
      .gte("pickup_datetime", nowIso)
      .order("pickup_datetime", { ascending: true })
      .limit(1)
      .maybeSingle(),
    // One read for every figure on the page. Counting these in SQL would be four more round
    // trips for numbers that are all derived from the same three columns.
    adminClient
      .from("bookings")
      .select("booking_status, pickup_datetime, total_price, currency")
      .eq("customer_id", userId),
  ])

  const rows = statusRows.data ?? []

  const counts: OverviewCounts = {
    total: rows.length,
    upcoming: 0,
    travelled: 0,
    cancelled: 0,
  }

  let amount = 0
  const currencies = new Set<string>()

  for (const row of rows) {
    if (row.booking_status === CANCELLED) {
      counts.cancelled += 1
      continue
    }
    if (row.pickup_datetime && row.pickup_datetime >= nowIso) {
      counts.upcoming += 1
    } else {
      counts.travelled += 1
    }
    amount += Number(row.total_price) || 0
    if (row.currency) {
      currencies.add(row.currency)
    }
  }

  return {
    asOf: nowIso,
    nextTransfer: nextRow.data ? toNextTransfer(nextRow.data) : null,
    counts,
    spend: currencies.size === 1 ? { amount, currency: Array.from(currencies)[0] } : null,
  }
}

/**
 * Flattens the assignment join down to two names.
 *
 * `booking_assignments` carries a row per assignment attempt, so a reassigned booking has more
 * than one and the closed ones must not win. Anything the vendor has withdrawn or cancelled is
 * dropped, and the newest surviving row supplies the names.
 */
type AssignmentRow = {
  status: string | null
  vendor: { business_name: string | null } | { business_name: string | null }[] | null
  driver: { first_name: string | null; last_name: string | null } | { first_name: string | null; last_name: string | null }[] | null
}

/** PostgREST returns an embedded one-to-one as an object or, depending on the join, a one-item array. */
function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

const DEAD_ASSIGNMENT = new Set(["cancelled", "rejected", "withdrawn", "expired"])

function toNextTransfer(row: Record<string, unknown>): NextTransfer {
  const assignments = (row.booking_assignments as AssignmentRow[] | null) ?? []
  const live = assignments.filter((a) => !DEAD_ASSIGNMENT.has((a.status ?? "").toLowerCase()))
  const active = live[live.length - 1] ?? null

  const driver = one(active?.driver ?? null)
  const driverName = driver
    ? [driver.first_name, driver.last_name].filter(Boolean).join(" ").trim() || null
    : null

  return {
    id: row.id as string,
    booking_number: row.booking_number as string,
    trip_number: (row.trip_number as string | null) ?? null,
    pickup_address: row.pickup_address as string,
    dropoff_address: row.dropoff_address as string,
    pickup_datetime: row.pickup_datetime as string,
    booking_status: row.booking_status as string,
    payment_status: row.payment_status as string,
    total_price: Number(row.total_price) || 0,
    currency: (row.currency as string) || "AED",
    passenger_count: (row.passenger_count as number | null) ?? null,
    vehicle_type: one(row.vehicle_type as { name: string } | { name: string }[] | null),
    trip_type: (row.trip_type as string | null) ?? null,
    hourly_package: (row.hourly_package as string | null) ?? null,
    duration_hours: row.duration_hours != null ? Number(row.duration_hours) : null,
    leg_index: (row.leg_index as number | null) ?? null,
    driver_name: driverName,
    vendor_name: one(active?.vendor ?? null)?.business_name ?? null,
  }
}
