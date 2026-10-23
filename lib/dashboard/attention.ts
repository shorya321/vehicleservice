/**
 * Pure building blocks for the dashboard's Needs Attention card. Queries live
 * in `attention-queries.ts`; this file only shapes counts into rows so the
 * rules can be tested without a database.
 */
import { formatCurrency } from '@/lib/utils'

export interface AttentionCounts {
  unassigned: number
  rejected: number
  awaitingVendor: number
  refundsDue: number
  refundsDueAmount: number
  vendorApplications: number
  businessApprovals: number
  reviews: number
  contactMessages: number
}

export type AttentionKey = Exclude<keyof AttentionCounts, 'refundsDueAmount'>

/** urgent: a trip has no vendor. waiting: someone owes a response. review: an admin decision. */
export type AttentionTone = 'urgent' | 'waiting' | 'review'

export interface AttentionItem {
  key: AttentionKey
  label: string
  description: string
  count: number
  href: string
  tone: AttentionTone
}

export const ATTENTION_ORDER: AttentionKey[] = [
  'unassigned',
  'rejected',
  'awaitingVendor',
  'refundsDue',
  'vendorApplications',
  'businessApprovals',
  'reviews',
  'contactMessages',
]

// Links use filters the list pages already understand. The bookings list has
// no assignment filter, so assignment queues open its upcoming view, where
// each trip row shows its vendor state.
const DEFINITIONS: Record<AttentionKey, Omit<AttentionItem, 'key' | 'count'>> = {
  unassigned: {
    label: 'Unassigned bookings',
    description: 'Upcoming trips with no vendor',
    href: '/admin/bookings?timeframe=upcoming',
    tone: 'urgent',
  },
  rejected: {
    label: 'Rejected, needs reassigning',
    description: 'Vendor declined, no new vendor yet',
    href: '/admin/bookings?timeframe=upcoming',
    tone: 'urgent',
  },
  awaitingVendor: {
    label: 'Awaiting vendor acceptance',
    description: 'Assigned, vendor has not responded',
    href: '/admin/bookings?timeframe=upcoming',
    tone: 'waiting',
  },
  refundsDue: {
    label: 'Refunds due',
    description: 'Customer and business bookings',
    href: '/admin/bookings?status=cancelled',
    tone: 'waiting',
  },
  vendorApplications: {
    label: 'Vendor applications',
    description: 'Waiting for review',
    href: '/admin/vendor-applications?status=pending',
    tone: 'review',
  },
  businessApprovals: {
    label: 'Business approvals',
    description: 'New business accounts pending',
    href: '/admin/businesses?status=pending',
    tone: 'review',
  },
  reviews: {
    label: 'Reviews to moderate',
    description: 'Pending approval',
    href: '/admin/reviews?status=pending',
    tone: 'review',
  },
  contactMessages: {
    label: 'New contact messages',
    description: 'Not replied yet',
    href: '/admin/contact?status=new',
    tone: 'review',
  },
}

export function emptyAttentionCounts(): AttentionCounts {
  return {
    unassigned: 0,
    rejected: 0,
    awaitingVendor: 0,
    refundsDue: 0,
    refundsDueAmount: 0,
    vendorApplications: 0,
    businessApprovals: 0,
    reviews: 0,
    contactMessages: 0,
  }
}

/** Only queues with work waiting, in a fixed order with urgent ones first. */
export function buildAttentionItems(counts: AttentionCounts): AttentionItem[] {
  return ATTENTION_ORDER.filter((key) => counts[key] > 0).map((key) => {
    const definition = DEFINITIONS[key]
    const description =
      key === 'refundsDue' && counts.refundsDueAmount > 0
        ? `${definition.description}, ${formatCurrency(counts.refundsDueAmount)}`
        : definition.description
    return { key, ...definition, description, count: counts[key] }
  })
}

interface UpcomingBookingRow {
  booking_assignments: Array<{ status: string }> | null
}

export interface AssignmentQueues {
  unassigned: number
  rejected: number
  awaitingVendor: number
}

// Same rule the bookings list uses for a live vendor (trip-group-row.tsx).
const ACTIVE_ASSIGNMENT = ['pending', 'accepted', 'completed']

/**
 * Splits upcoming, non-cancelled bookings by vendor state. A rejection only
 * counts while no live assignment has replaced it, so reassigned bookings
 * drop out instead of lingering as stale rejections.
 */
export function classifyUpcomingBookings(rows: UpcomingBookingRow[]): AssignmentQueues {
  return rows.reduce<AssignmentQueues>(
    (queues, row) => {
      const assignments = row.booking_assignments ?? []
      const active = assignments.find((a) => ACTIVE_ASSIGNMENT.includes(a.status))
      if (active) {
        return active.status === 'pending'
          ? { ...queues, awaitingVendor: queues.awaitingVendor + 1 }
          : queues
      }
      return assignments.some((a) => a.status === 'rejected')
        ? { ...queues, rejected: queues.rejected + 1 }
        : { ...queues, unassigned: queues.unassigned + 1 }
    },
    { unassigned: 0, rejected: 0, awaitingVendor: 0 }
  )
}
