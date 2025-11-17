'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { startOfDay, subDays, subWeeks, subMonths, startOfWeek, startOfMonth, format } from 'date-fns'

export type PeriodType = 'daily' | 'weekly' | 'monthly'

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
  const sevenDaysAgo = subDays(new Date(), 7)

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

  // Get recent bookings
  const { data: recentBookingsData } = await adminClient
    .from('bookings')
    .select(`
      id,
      booking_number,
      booking_status,
      total_price,
      pickup_datetime,
      customer:profiles!customer_id(full_name),
      from_location:locations!from_location_id(name),
      to_location:locations!to_location_id(name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentBookings: DashboardMetrics['recentBookings'] = recentBookingsData?.map(b => ({
    id: b.id,
    bookingNumber: b.booking_number,
    customerName: b.customer?.full_name || 'Guest',
    route: `${b.from_location?.name || 'Unknown'} → ${b.to_location?.name || 'Unknown'}`,
    status: b.booking_status,
    amount: Number(b.total_price),
    time: new Date(b.pickup_datetime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  })) || []

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
      description: `New booking ${booking.booking_number} created`,
      timestamp: booking.created_at,
      timeAgo: formatTimeAgo(booking.created_at),
      userInfo: `${customerName} • ${route}`
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

export async function getRevenueTrend(period: PeriodType = 'daily') {
  const adminClient = createAdminClient()
  let startDate: Date
  let endDate: Date = new Date()
  let dataPoints: number

  switch (period) {
    case 'daily':
      startDate = subDays(new Date(), 7)
      dataPoints = 7
      break
    case 'weekly':
      startDate = subWeeks(new Date(), 8)
      dataPoints = 8
      break
    case 'monthly':
      startDate = subMonths(new Date(), 12)
      dataPoints = 12
      break
  }

  // Get bookings based on environment
  const isDevelopment = process.env.NODE_ENV === 'development'

  const { data: revenueData, error } = await adminClient
    .from('bookings')
    .select('total_price, created_at, payment_status')
    .in('payment_status', isDevelopment
      ? ['completed', 'pending', 'processing'] // Include more statuses in dev
      : ['completed']) // Only completed in production
    .order('created_at')

  if (error) {
    console.error('[Revenue Trend] Error fetching bookings:', error)
  }

  // Only log in development
  if (isDevelopment) {
    console.log('[Revenue Trend] Fetched bookings count:', revenueData?.length || 0)
    if (!revenueData || revenueData.length === 0) {
      const { data: allBookings, error: allError } = await adminClient
        .from('bookings')
        .select('total_price, created_at, payment_status')
        .limit(10)
      console.log('[Revenue Trend] Sample bookings in DB:', allBookings)
      if (allError) {
        console.error('[Revenue Trend] Error fetching all bookings:', allError)
      }
    } else {
      // Log first few bookings for debugging
      console.log('[Revenue Trend] First booking:', revenueData[0])
    }
  }

  const revenueTrend: Array<{ date: string; label: string; revenue: number }> = []

  if (period === 'daily') {
    // Show last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = date.toISOString().split('T')[0]

      // Also check for future dates in case of test data
      const dayRevenue = revenueData
        ?.filter(b => {
          const bookingDateStr = b.created_at.split('T')[0]
          return bookingDateStr === dateStr
        })
        .reduce((sum, b) => sum + Number(b.total_price || 0), 0) || 0

      revenueTrend.push({
        date: dateStr,
        label: format(date, 'EEE'),
        revenue: dayRevenue
      })
    }

    // If we have future test data, show it as well (only in development)
    if (isDevelopment) {
      const futureBookings = revenueData?.filter(b => {
        const bookingDate = new Date(b.created_at)
        return bookingDate > new Date()
      }) || []

      if (futureBookings.length > 0) {
        console.log('[Revenue Trend] Found future-dated bookings (test data):', futureBookings.length)
      }
    }

  } else if (period === 'weekly') {
    // Show last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const weekRevenue = revenueData
        ?.filter(b => {
          const bookingDate = new Date(b.created_at)
          return bookingDate >= weekStart && bookingDate <= weekEnd
        })
        .reduce((sum, b) => sum + Number(b.total_price || 0), 0) || 0

      // Only check for debug info in development
      if (isDevelopment && weekRevenue > 0) {
        console.log(`[Revenue Trend] Week ${8 - i}: ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}, Revenue: $${weekRevenue}`)
      }

      revenueTrend.push({
        date: weekStart.toISOString().split('T')[0],
        label: `W${8 - i}`,
        revenue: weekRevenue
      })
    }
  } else if (period === 'monthly') {
    // Show last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

      const monthRevenue = revenueData
        ?.filter(b => {
          const bookingDate = new Date(b.created_at)
          return bookingDate >= monthStart && bookingDate <= monthEnd
        })
        .reduce((sum, b) => sum + Number(b.total_price || 0), 0) || 0

      // Only check for debug info in development
      if (isDevelopment && monthRevenue > 0) {
        console.log(`[Revenue Trend] ${format(monthStart, 'MMM yyyy')}: Revenue: $${monthRevenue}`)
      }

      revenueTrend.push({
        date: monthStart.toISOString().split('T')[0],
        label: format(monthStart, 'MMM'),
        revenue: monthRevenue
      })
    }
  }

  return revenueTrend
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