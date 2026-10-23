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
  /** 1 when the newest exchange rate is too old, else 0. */
  staleRates: number
  lowWallets: number
  vendorDocuments: number
  driverLicences: number
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
  'staleRates',
  'lowWallets',
  'vendorDocuments',
  'driverLicences',
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
  staleRates: {
    label: 'Exchange rates out of date',
    description: 'Last refresh over 36 hours ago',
    href: '/admin/settings/currencies',
    tone: 'urgent',
  },
  lowWallets: {
    label: 'Low business wallets',
    description: 'Below their alert threshold or frozen',
    href: '/admin/businesses?status=active',
    tone: 'waiting',
  },
  vendorDocuments: {
    label: 'Vendor documents expiring',
    description: 'Trade licence or insurance, within 30 days',
    href: '/admin/vendor-applications?status=approved',
    tone: 'waiting',
  },
  // No admin drivers page exists; drivers belong to approved vendors.
  driverLicences: {
    label: 'Driver licences expiring',
    description: 'Expired or due within 30 days',
    href: '/admin/vendor-applications?status=approved',
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
    staleRates: 0,
    lowWallets: 0,
    vendorDocuments: 0,
    driverLicences: 0,
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

export const EXPIRY_WINDOW_DAYS = 30
export const STALE_RATES_HOURS = 36
/** Same fallback the business low-balance alert uses (app/api/business/bookings/route.ts). */
const DEFAULT_LOW_BALANCE_THRESHOLD = 100

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}/

/**
 * True when a document has expired or expires within the window. Compares
 * calendar days, so `today` must be the operating-timezone day (`bookingToday()`).
 */
export function isExpiringSoon(
  expiry: string | null | undefined,
  today: string,
  windowDays: number = EXPIRY_WINDOW_DAYS
): boolean {
  if (!expiry || !DAY_PATTERN.test(expiry)) return false
  const day = expiry.slice(0, 10)
  const limit = new Date(`${today}T00:00:00Z`)
  limit.setUTCDate(limit.getUTCDate() + windowDays)
  return day <= limit.toISOString().slice(0, 10)
}

interface VendorDocumentsRow {
  documents: unknown
}

function documentField(documents: unknown, key: string): string | null {
  if (!documents || typeof documents !== 'object') return null
  const value = (documents as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : null
}

/** Vendors with a trade licence or insurance due, each counted once. */
export function countExpiringVendorDocuments(rows: VendorDocumentsRow[], today: string): number {
  return rows.filter(
    ({ documents }) =>
      isExpiringSoon(documentField(documents, 'trade_license_expiry'), today) ||
      isExpiringSoon(documentField(documents, 'insurance_expiry'), today)
  ).length
}

interface WalletRow {
  wallet_balance: number | null
  wallet_frozen_at: string | null
  notification_preferences: unknown
}

function lowBalanceThreshold(preferences: unknown): number {
  if (!preferences || typeof preferences !== 'object') return DEFAULT_LOW_BALANCE_THRESHOLD
  const alert = (preferences as Record<string, unknown>).low_balance_alert
  if (!alert || typeof alert !== 'object') return DEFAULT_LOW_BALANCE_THRESHOLD
  const threshold = Number((alert as Record<string, unknown>).threshold)
  return Number.isFinite(threshold) ? threshold : DEFAULT_LOW_BALANCE_THRESHOLD
}

/** A frozen wallet, or a balance below the account's own alert threshold. */
export function isLowWallet(account: WalletRow): boolean {
  if (account.wallet_frozen_at) return true
  return Number(account.wallet_balance ?? 0) < lowBalanceThreshold(account.notification_preferences)
}

/** The daily refresh logs nothing, so the newest `fetched_at` is the only health signal. */
export function ratesAreStale(
  latestFetchedAt: string | null,
  now: Date = new Date(),
  maxAgeHours: number = STALE_RATES_HOURS
): boolean {
  if (!latestFetchedAt) return true
  const fetched = new Date(latestFetchedAt).getTime()
  if (Number.isNaN(fetched)) return true
  return now.getTime() - fetched > maxAgeHours * 60 * 60 * 1000
}
