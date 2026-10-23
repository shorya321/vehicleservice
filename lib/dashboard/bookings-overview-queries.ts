import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { startOfBookingMonthUtc } from '@/lib/utils/timezone'
import {
  buildBookingsOverview,
  emptySourceTotals,
  type BookingsOverview,
  type SourceTotals,
} from '@/lib/dashboard/bookings-overview'

type AdminClient = ReturnType<typeof createAdminClient>
type BookingTable = 'bookings' | 'business_bookings'

/** Same exclusion the bookings page stats use. */
const TEST_BOOKING_PATTERN = 'TEST-%'
const PAGE_SIZE = 1000
/** Backstop so a runaway table can never stall the dashboard. */
const MAX_PAGES = 50

async function countRows(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>
): Promise<number> {
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}

/**
 * Paid revenue, all time and since `monthStartIso`, in one paged pass.
 * PostgREST caps a response at 1000 rows, so a single select would undercount.
 */
async function paidRevenue(
  client: AdminClient,
  table: BookingTable,
  monthStartIso: string
): Promise<{ all: number; month: number }> {
  const monthStart = new Date(monthStartIso).getTime()
  let all = 0
  let month = 0
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE
    const { data, error } = await client
      .from(table)
      .select('total_price, created_at')
      .eq('payment_status', 'completed')
      .not('booking_number', 'like', TEST_BOOKING_PATTERN)
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    for (const row of data ?? []) {
      const price = Number(row.total_price) || 0
      all += price
      if (row.created_at && new Date(row.created_at).getTime() >= monthStart) month += price
    }
    if (!data || data.length < PAGE_SIZE) break
  }
  return { all, month }
}

async function sourceTotals(client: AdminClient, table: BookingTable, monthStartIso: string): Promise<SourceTotals> {
  const base = () =>
    client
      .from(table)
      .select('id', { count: 'exact', head: true })
      .not('booking_number', 'like', TEST_BOOKING_PATTERN)

  const [allBookings, monthBookings, monthCancelled, revenue] = await Promise.all([
    countRows(base()),
    countRows(base().gte('created_at', monthStartIso)),
    countRows(base().gte('created_at', monthStartIso).eq('booking_status', 'cancelled')),
    paidRevenue(client, table, monthStartIso),
  ])

  return { allBookings, monthBookings, monthCancelled, allRevenue: revenue.all, monthRevenue: revenue.month }
}

export interface BookingsOverviewResult extends BookingsOverview {
  error: string | null
}

/**
 * Customer and business bookings side by side. "This month" is booked since the
 * 1st in the operating timezone, the same sold-date basis as the revenue chart.
 */
export async function getBookingsOverview(): Promise<BookingsOverviewResult> {
  const client = createAdminClient()
  const monthStartIso = startOfBookingMonthUtc().toISOString()

  try {
    const [customer, business] = await Promise.all([
      sourceTotals(client, 'bookings', monthStartIso),
      sourceTotals(client, 'business_bookings', monthStartIso),
    ])
    return { ...buildBookingsOverview(customer, business), error: null }
  } catch (error: unknown) {
    console.error('[dashboard] bookings overview failed:', error)
    return {
      ...buildBookingsOverview(emptySourceTotals(), emptySourceTotals()),
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
