import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  classifyUpcomingBookings,
  emptyAttentionCounts,
  type AttentionCounts,
} from '@/lib/dashboard/attention'

type AdminClient = ReturnType<typeof createAdminClient>

/** Same exclusion the bookings page stats use. */
const TEST_BOOKING_PATTERN = 'TEST-%'
const PAGE_SIZE = 1000
/** Backstop so a runaway table can never stall the dashboard. */
const MAX_PAGES = 10

interface UpcomingRow {
  booking_assignments: Array<{ status: string }> | null
}

/**
 * Upcoming, non-cancelled bookings with their assignment states. Paged because
 * PostgREST caps a single response at 1000 rows.
 */
async function fetchUpcoming(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: UpcomingRow[] | null; error: { message: string } | null }>
): Promise<UpcomingRow[]> {
  const rows: UpcomingRow[] = []
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }
  return rows
}

async function exactCount(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>
): Promise<number> {
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}

async function refundsDue(client: AdminClient): Promise<{ count: number; amount: number }> {
  const [customer, business] = await Promise.all([
    client.from('bookings').select('refund_due').gt('refund_due', 0),
    client.from('business_bookings').select('refund_due').gt('refund_due', 0),
  ])
  if (customer.error) throw new Error(customer.error.message)
  if (business.error) throw new Error(business.error.message)
  const rows = [...(customer.data ?? []), ...(business.data ?? [])]
  return {
    count: rows.length,
    amount: rows.reduce((sum, row) => sum + Number(row.refund_due ?? 0), 0),
  }
}

export interface AttentionResult {
  counts: AttentionCounts
  error: string | null
}

/**
 * Every queue an admin acts on, counted once. A failure returns empty counts
 * with the error, so the card can say it could not load instead of claiming
 * nothing needs attention.
 */
export async function getAttentionCounts(): Promise<AttentionResult> {
  const client = createAdminClient()
  const nowIso = new Date().toISOString()

  try {
    const [customerUpcoming, businessUpcoming, refunds, vendorApplications, businessApprovals, reviews, contactMessages] =
      await Promise.all([
        fetchUpcoming((from, to) =>
          client
            .from('bookings')
            .select('booking_assignments(status)')
            .gte('pickup_datetime', nowIso)
            .neq('booking_status', 'cancelled')
            .not('booking_number', 'like', TEST_BOOKING_PATTERN)
            .order('id')
            .range(from, to)
        ),
        fetchUpcoming((from, to) =>
          client
            .from('business_bookings')
            .select('booking_assignments!booking_assignments_business_booking_id_fkey(status)')
            .gte('pickup_datetime', nowIso)
            .neq('booking_status', 'cancelled')
            .not('booking_number', 'like', TEST_BOOKING_PATTERN)
            .order('id')
            .range(from, to)
        ),
        refundsDue(client),
        exactCount(client.from('vendor_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
        exactCount(client.from('business_accounts').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
        exactCount(client.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
        exactCount(client.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('status', 'new')),
      ])

    const queues = classifyUpcomingBookings([...customerUpcoming, ...businessUpcoming])

    return {
      counts: {
        ...queues,
        refundsDue: refunds.count,
        refundsDueAmount: refunds.amount,
        vendorApplications,
        businessApprovals,
        reviews,
        contactMessages,
      },
      error: null,
    }
  } catch (error: unknown) {
    console.error('[dashboard] attention counts failed:', error)
    return {
      counts: emptyAttentionCounts(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
