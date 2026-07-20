'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { startOfDay, subDays, format } from 'date-fns'
import { BOOKING_TIMEZONE, bookingToday } from '@/lib/utils/timezone'
import {
  bucketKeyForDubaiDay,
  buildBuckets,
  dubaiDayFromIso,
  presetForPeriod,
  resolveRevenueRange,
  toUtcBounds,
  type PeriodType,
  type RevenueRangeInput,
  type RevenueTrendPoint,
  type RevenueTrendResult,
} from '@/lib/dashboard/revenue-range'

export interface DashboardMetrics {
  // Primary KPIs
  todayRevenue: number
  revenueChange: number
  activeBookings: number
  pendingActions: number
  completedBookingsToday: number
  rejectedBookings: number

  // Revenue trend
  revenueTrend: Array<{
    date: string
    label: string
    revenue: number
  }>

  // Recent bookings
  recentBookings: Array<{
    id: string
    bookingNumber: string
    tripNumber: string
    customerName: string
    route: string
    status: string
    amount: number
    time: string
  }>

  // Quick stats
  availableUsers: number
  activeVendors: number
  availableVehicles: number
  topRoute: string

  // Alerts
  alerts: Array<{
    type: 'warning' | 'error' | 'info'
    message: string
    count?: number
  }>

  // Recent activities
  recentActivities: Array<{
    id: string
    type: 'booking_created' | 'vendor_application' | 'booking_confirmed' | 'payment_completed' | 'vehicle_added' | 'user_registered' | 'booking_rejected'
    description: string
    timestamp: string
    timeAgo: string
    userInfo?: string
  }>
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const adminClient = createAdminClient()
  const today = startOfDay(new Date())
  const yesterday = startOfDay(subDays(new Date(), 1))

  // Fetch today's revenue and compare with yesterday
  const { data: todayBookings } = await adminClient
    .from('bookings')
    .select('total_price')
    .gte('created_at', today.toISOString())
    .eq('payment_status', 'completed')

  const { data: yesterdayBookings } = await adminClient
    .from('bookings')
    .select('total_price')
    .gte('created_at', yesterday.toISOString())
    .lt('created_at', today.toISOString())
    .eq('payment_status', 'completed')

  const todayRevenue = todayBookings?.reduce((sum, b) => sum + Number(b.total_price), 0) || 0
  const yesterdayRevenue = yesterdayBookings?.reduce((sum, b) => sum + Number(b.total_price), 0) || 0
  const revenueChange = yesterdayRevenue > 0
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
    : 0

  // Get active bookings (confirmed, pickup within next 24 hours)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: activeBookingsData } = await adminClient
    .from('bookings')
    .select('id')
    .eq('booking_status', 'confirmed')
    .gte('pickup_datetime', new Date().toISOString())
    .lte('pickup_datetime', tomorrow.toISOString())

  const activeBookings = activeBookingsData?.length || 0

  // Get pending actions (unassigned bookings + pending payments + rejected bookings)
  const { data: pendingAssignments } = await adminClient
    .from('booking_assignments')
    .select('id')
    .eq('status', 'pending')

  const { data: pendingPayments } = await adminClient
    .from('bookings')
    .select('id')
    .in('payment_status', ['pending', 'failed'])
    .gte('created_at', yesterday.toISOString())

  const { data: rejectedAssignments } = await adminClient
    .from('booking_assignments')
    .select('id')
    .eq('status', 'rejected')

  const pendingActions = (pendingAssignments?.length || 0) + (pendingPayments?.length || 0) + (rejectedAssignments?.length || 0)
  const rejectedBookings = rejectedAssignments?.length || 0

  // Get completed bookings today (booking completed and payment completed)
  const { data: completedTodayData } = await adminClient
    .from('bookings')
    .select('id')
    .gte('created_at', today.toISOString())
    .eq('booking_status', 'completed')
    .eq('payment_status', 'completed')

  const completedBookingsToday = completedTodayData?.length || 0

  // Get default daily revenue trend
  const revenueTrend = await getRevenueTrend('daily')

  // Get recent bookings (regular + business)
  const [{ data: recentBookingsData }, { data: recentBusinessBookingsData }] = await Promise.all([
    adminClient
      .from('bookings')
      .select(`
        id,
        booking_number,
        trip_number,
        booking_status,
        total_price,
        pickup_datetime,
        created_at,
        customer:profiles!customer_id(full_name),
        from_location:locations!from_location_id(name),
        to_location:locations!to_location_id(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient
      .from('business_bookings')
      .select(`
        id,
        booking_number,
        trip_number,
        booking_status,
        total_price,
        pickup_datetime,
        created_at,
        customer_name,
        from_location:locations!from_location_id(name),
        to_location:locations!to_location_id(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)
  ])

  const regularMapped = recentBookingsData?.map(b => ({
    id: b.id,
    bookingNumber: b.booking_number,
    tripNumber: b.trip_number,
    customerName: b.customer?.full_name || 'Guest',
    route: `${b.from_location?.name || 'Unknown'} → ${b.to_location?.name || 'Unknown'}`,
    status: b.booking_status,
    amount: Number(b.total_price),
    time: new Date(b.pickup_datetime).toLocaleString('en-US', {
      timeZone: BOOKING_TIMEZONE,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    _createdAt: b.created_at || ''
  })) || []

  const businessMapped = recentBusinessBookingsData?.map(b => ({
    id: b.id,
    bookingNumber: b.booking_number,
    tripNumber: b.trip_number,
    customerName: b.customer_name || 'Business Guest',
    route: `${b.from_location?.name || 'Unknown'} → ${b.to_location?.name || 'Unknown'}`,
    status: b.booking_status,
    amount: Number(b.total_price),
    time: new Date(b.pickup_datetime).toLocaleString('en-US', {
      timeZone: BOOKING_TIMEZONE,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    _createdAt: b.created_at || ''
  })) || []

  const recentBookings: DashboardMetrics['recentBookings'] = [...regularMapped, ...businessMapped]
    .sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime())
    .slice(0, 5)
    .map(({ _createdAt, ...rest }) => rest)

  // Quick stats
  const { data: availableUsers } = await adminClient
    .from('profiles')
    .select('id')
    .eq('status', 'active')

  const { data: vendors } = await adminClient
    .from('vendor_applications')
    .select('id')
    .eq('status', 'approved')

  const { data: vehicles } = await adminClient
    .from('vehicles')
    .select('id')
    .eq('is_available', true)

  // Get top route today
  const { data: todayRoutes } = await adminClient
    .from('bookings')
    .select(`
      from_location:locations!from_location_id(name),
      to_location:locations!to_location_id(name)
    `)
    .gte('created_at', today.toISOString())

  const routeCounts = new Map<string, number>()
  todayRoutes?.forEach(r => {
    if (r.from_location && r.to_location) {
      const route = `${r.from_location.name} → ${r.to_location.name}`
      routeCounts.set(route, (routeCounts.get(route) || 0) + 1)
    }
  })

  const topRoute = Array.from(routeCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'No bookings today'

  // Build alerts
  const alerts: DashboardMetrics['alerts'] = []

  if (pendingAssignments && pendingAssignments.length > 0) {
    alerts.push({
      type: 'warning',
      message: 'Bookings awaiting vendor assignment',
      count: pendingAssignments.length
    })
  }

  if (rejectedAssignments && rejectedAssignments.length > 0) {
    alerts.push({
      type: 'warning',
      message: 'Rejected bookings need reassignment',
      count: rejectedAssignments.length
    })
  }

  if (pendingPayments && pendingPayments.length > 0) {
    alerts.push({
      type: 'error',
      message: 'Failed or pending payments',
      count: pendingPayments.length
    })
  }

  const { data: lowDrivers } = await adminClient
    .from('vendor_drivers')
    .select('id')
    .eq('is_available', true)

  if (lowDrivers && lowDrivers.length < 5) {
    alerts.push({
      type: 'info',
      message: `Only ${lowDrivers.length} drivers available`,
    })
  }

  // Get recent activities (last 48 hours)
  const twoDaysAgo = subDays(new Date(), 2)
  const activities: DashboardMetrics['recentActivities'] = []

  // Recent bookings
  const { data: recentBookingsActivity } = await adminClient
    .from('bookings')
    .select(`
      id,
      booking_number,
      trip_number,
      created_at,
      customer:profiles!customer_id(full_name),
      from_location:locations!from_location_id(name),
      to_location:locations!to_location_id(name)
    `)
    .gte('created_at', twoDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  recentBookingsActivity?.forEach(booking => {
    const customerName = booking.customer?.full_name || 'Guest'
    const route = `${booking.from_location?.name || 'Unknown'} → ${booking.to_location?.name || 'Unknown'}`
    activities.push({
      id: `booking-${booking.id}`,
      type: 'booking_created',
      description: `New booking ${booking.trip_number || booking.booking_number} created`,
      timestamp: booking.created_at,
      timeAgo: formatTimeAgo(booking.created_at),
      userInfo: `${customerName} • ${route}`
    })
  })

  // Recent business bookings
  const { data: recentBusinessActivity } = await adminClient
    .from('business_bookings')
    .select(`
      id,
      booking_number,
      trip_number,
      created_at,
      customer_name,
      from_location:locations!from_location_id(name),
      to_location:locations!to_location_id(name)
    `)
    .gte('created_at', twoDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  recentBusinessActivity?.forEach(booking => {
    const route = `${booking.from_location?.name || 'Unknown'} → ${booking.to_location?.name || 'Unknown'}`
    activities.push({
      id: `business-booking-${booking.id}`,
      type: 'booking_created',
      description: `New business booking ${booking.trip_number || booking.booking_number} created`,
      timestamp: booking.created_at || '',
      timeAgo: formatTimeAgo(booking.created_at || ''),
      userInfo: `${booking.customer_name} • ${route}`
    })
  })

  // Recent vendor applications
  const { data: recentVendorApps } = await adminClient
    .from('vendor_applications')
    .select(`
      id,
      business_name,
      created_at,
      user:profiles!user_id(full_name)
    `)
    .gte('created_at', twoDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(5)

  recentVendorApps?.forEach(app => {
    const userName = app.user?.full_name || 'Unknown User'
    activities.push({
      id: `vendor-${app.id}`,
      type: 'vendor_application',
      description: `New vendor application submitted`,
      timestamp: app.created_at,
      timeAgo: formatTimeAgo(app.created_at),
      userInfo: `${userName} • ${app.business_name}`
    })
  })

  // Recent vehicle additions
  const { data: recentVehicles } = await adminClient
    .from('vehicles')
    .select(`
      id,
      make,
      model,
      created_at,
      vendor:profiles!vendor_id(full_name)
    `)
    .gte('created_at', twoDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(5)

  recentVehicles?.forEach(vehicle => {
    const vendorName = vehicle.vendor?.full_name || 'Unknown Vendor'
    activities.push({
      id: `vehicle-${vehicle.id}`,
      type: 'vehicle_added',
      description: `New vehicle added to fleet`,
      timestamp: vehicle.created_at,
      timeAgo: formatTimeAgo(vehicle.created_at),
      userInfo: `${vendorName} • ${vehicle.make} ${vehicle.model}`
    })
  })

  // Recent user registrations
  const { data: recentUsers } = await adminClient
    .from('profiles')
    .select('id, full_name, created_at')
    .gte('created_at', twoDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(5)

  recentUsers?.forEach(user => {
    activities.push({
      id: `user-${user.id}`,
      type: 'user_registered',
      description: `New user registered`,
      timestamp: user.created_at,
      timeAgo: formatTimeAgo(user.created_at),
      userInfo: user.full_name || 'Unknown User'
    })
  })

  // Sort all activities by timestamp (newest first) and limit to 10
  const recentActivities = activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  return {
    todayRevenue,
    revenueChange,
    activeBookings,
    pendingActions,
    completedBookingsToday,
    rejectedBookings,
    revenueTrend,
    recentBookings,
    availableUsers: availableUsers?.length || 0,
    activeVendors: vendors?.length || 0,
    availableVehicles: vehicles?.length || 0,
    topRoute,
    alerts,
    recentActivities
  }
}

/** PostgREST returns at most 1000 rows per request. */
const REVENUE_PAGE_SIZE = 1000

/** Safety stop so a pathological range can't page forever. */
const REVENUE_MAX_ROWS = 50_000

/**
 * Production counts only settled revenue. Development also counts in-flight
 * payments so a fresh local DB isn't blank — the difference is surfaced in
 * the returned meta rather than left silent.
 */
function includedPaymentStatuses(): string[] {
  return process.env.NODE_ENV === 'development'
    ? ['completed', 'pending', 'processing']
    : ['completed']
}

function normalizeTrendInput(input: RevenueRangeInput | PeriodType): RevenueRangeInput {
  if (typeof input === 'string') return { preset: presetForPeriod(input) }
  return input
}

/**
 * Pages through every booking in the window.
 *
 * The previous implementation issued a single unbounded query, which PostgREST
 * silently capped at 1000 rows — and because it ordered ascending, the rows it
 * dropped were the most recent ones.
 */
async function fetchBookingsInRange(
  adminClient: ReturnType<typeof createAdminClient>,
  fromUtc: Date,
  toUtcExclusive: Date,
  statuses: string[]
): Promise<{ rows: Array<{ total_price: number | null; created_at: string }>; truncated: boolean }> {
  const rows: Array<{ total_price: number | null; created_at: string }> = []

  for (let page = 0; page * REVENUE_PAGE_SIZE < REVENUE_MAX_ROWS; page++) {
    const start = page * REVENUE_PAGE_SIZE
    const { data, error } = await adminClient
      .from('bookings')
      .select('total_price, created_at')
      .in('payment_status', statuses)
      .gte('created_at', fromUtc.toISOString())
      .lt('created_at', toUtcExclusive.toISOString())
      .order('created_at', { ascending: true })
      .range(start, start + REVENUE_PAGE_SIZE - 1)

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return { rows, truncated: false }

    rows.push(...(data as Array<{ total_price: number | null; created_at: string }>))

    if (data.length < REVENUE_PAGE_SIZE) return { rows, truncated: false }
  }

  return { rows, truncated: true }
}

export async function getRevenueTrendWithMeta(
  input: RevenueRangeInput | PeriodType = {}
): Promise<RevenueTrendResult> {
  const adminClient = createAdminClient()
  const range = resolveRevenueRange(normalizeTrendInput(input), bookingToday())
  const buckets = buildBuckets(range)
  const statuses = includedPaymentStatuses()

  const emptyPoints: RevenueTrendPoint[] = buckets.map(({ date, label }) => ({
    date,
    label,
    revenue: 0,
  }))

  try {
    const { fromUtc, toUtcExclusive } = toUtcBounds(range)

    const [{ rows, truncated }, { count }] = await Promise.all([
      fetchBookingsInRange(adminClient, fromUtc, toUtcExclusive, statuses),
      adminClient
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .in('payment_status', statuses),
    ])

    const totalsByBucket = new Map<string, number>()
    for (const row of rows) {
      if (!row.created_at) continue
      const key = bucketKeyForDubaiDay(dubaiDayFromIso(row.created_at), range.bucket)
      totalsByBucket.set(key, (totalsByBucket.get(key) ?? 0) + Number(row.total_price || 0))
    }

    return {
      points: buckets.map(({ key, date, label }) => ({
        date,
        label,
        revenue: totalsByBucket.get(key) ?? 0,
      })),
      meta: {
        range,
        totalRows: rows.length,
        truncated,
        hasAnyHistory: (count ?? 0) > 0,
        includedPaymentStatuses: statuses,
        error: null,
      },
    }
  } catch (error: unknown) {
    // Previously a failed query only logged and then rendered as zeros, which
    // is indistinguishable from "no revenue". Surface it instead.
    const message = error instanceof Error ? error.message : 'Failed to load revenue trend'
    console.error('[Revenue Trend] Error fetching bookings:', message)

    return {
      points: emptyPoints,
      meta: {
        range,
        totalRows: 0,
        truncated: false,
        hasAnyHistory: false,
        includedPaymentStatuses: statuses,
        error: message,
      },
    }
  }
}

/**
 * Backwards-compatible wrapper: returns just the points.
 *
 * Accepts the legacy `PeriodType` so existing callers keep working; prefer
 * `getRevenueTrendWithMeta` for new code, which reports sparse/truncated data.
 */
export async function getRevenueTrend(
  input: RevenueRangeInput | PeriodType = {}
): Promise<RevenueTrendPoint[]> {
  const { points } = await getRevenueTrendWithMeta(input)
  return points
}

// Helper function to format time ago
function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - then.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays}d ago`

  return format(then, 'MMM d')
}