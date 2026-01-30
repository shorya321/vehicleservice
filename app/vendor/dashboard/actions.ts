'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { subDays, subWeeks, subMonths, startOfWeek, startOfMonth, format } from 'date-fns'

export type PeriodType = 'daily' | 'weekly' | 'monthly'

export interface VendorDashboardStats {
  totalVehicles: number
  totalDrivers: number
  monthlyRevenue: number
  averageRating: number
  hasRatings: boolean
}

export interface BusinessActivity {
  id: string
  action: string
  details: string
  time: string
  type: 'update' | 'team' | 'security' | 'vehicle' | 'driver' | 'milestone'
}

export async function getVendorDashboardStats(): Promise<VendorDashboardStats> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { totalVehicles: 0, totalDrivers: 0, monthlyRevenue: 0, averageRating: 0, hasRatings: false }
  }

  // Get vendor application
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    return { totalVehicles: 0, totalDrivers: 0, monthlyRevenue: 0, averageRating: 0, hasRatings: false }
  }

  // 1. Count total vehicles
  const { count: vehicleCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', vendorApp.id)

  // 2. Count total active drivers
  const { count: driverCount } = await supabase
    .from('vendor_drivers')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendorApp.id)
    .eq('is_active', true)

  // 3. Calculate this month's revenue from completed bookings
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Get all completed booking assignments for this vendor this month
  const { data: completedAssignments } = await adminClient
    .from('booking_assignments')
    .select('booking_id, business_booking_id, completed_at')
    .eq('vendor_id', vendorApp.id)
    .eq('status', 'completed')
    .gte('completed_at', startOfMonth.toISOString())

  let monthlyRevenue = 0

  if (completedAssignments && completedAssignments.length > 0) {
    // Fetch revenue from both customer and business bookings
    const customerBookingIds = completedAssignments
      .filter(a => a.booking_id)
      .map(a => a.booking_id)

    const businessBookingIds = completedAssignments
      .filter(a => a.business_booking_id)
      .map(a => a.business_booking_id)

    // Get customer booking totals
    if (customerBookingIds.length > 0) {
      const { data: customerBookings } = await adminClient
        .from('bookings')
        .select('total_price')
        .in('id', customerBookingIds)

      if (customerBookings) {
        monthlyRevenue += customerBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0)
      }
    }

    // Get business booking totals
    if (businessBookingIds.length > 0) {
      const { data: businessBookings } = await adminClient
        .from('business_bookings')
        .select('total_price')
        .in('id', businessBookingIds)

      if (businessBookings) {
        monthlyRevenue += businessBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0)
      }
    }
  }

  // 4. Calculate average rating from reviews
  // Get all booking IDs for this vendor (completed only)
  const { data: allCompletedAssignments } = await adminClient
    .from('booking_assignments')
    .select('booking_id')
    .eq('vendor_id', vendorApp.id)
    .eq('status', 'completed')
    .not('booking_id', 'is', null)

  let averageRating = 0
  let hasRatings = false

  if (allCompletedAssignments && allCompletedAssignments.length > 0) {
    const bookingIds = allCompletedAssignments.map(a => a.booking_id).filter(Boolean)

    if (bookingIds.length > 0) {
      const { data: reviews } = await adminClient
        .from('reviews')
        .select('rating')
        .in('booking_id', bookingIds)

      if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
        averageRating = totalRating / reviews.length
        hasRatings = true
      }
    }
  }

  return {
    totalVehicles: vehicleCount || 0,
    totalDrivers: driverCount || 0,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100, // Round to 2 decimals
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    hasRatings
  }
}

export async function getRecentBusinessActivities(): Promise<BusinessActivity[]> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  // Get vendor application
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id, updated_at')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    return []
  }

  const activities: BusinessActivity[] = []

  // Get recent notifications (if vendor has any)
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, message, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  if (notifications) {
    notifications.forEach(n => {
      activities.push({
        id: n.id,
        action: n.title,
        details: n.message,
        time: formatTimeAgo(new Date(n.created_at)),
        type: n.type as any || 'update'
      })
    })
  }

  // Get recent vehicle additions (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentVehicles } = await supabase
    .from('vehicles')
    .select('id, make, model, created_at')
    .eq('business_id', vendorApp.id)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(2)

  if (recentVehicles) {
    recentVehicles.forEach(v => {
      activities.push({
        id: v.id,
        action: 'New vehicle added',
        details: `${v.make} ${v.model} added to fleet`,
        time: formatTimeAgo(new Date(v.created_at)),
        type: 'vehicle'
      })
    })
  }

  // Get recent driver additions (last 7 days)
  const { data: recentDrivers } = await supabase
    .from('vendor_drivers')
    .select('id, first_name, last_name, created_at')
    .eq('vendor_id', vendorApp.id)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(2)

  if (recentDrivers) {
    recentDrivers.forEach(d => {
      activities.push({
        id: d.id,
        action: 'New driver added',
        details: `${d.first_name} ${d.last_name} joined the team`,
        time: formatTimeAgo(new Date(d.created_at)),
        type: 'driver'
      })
    })
  }

  // Get weekly booking milestone (if significant)
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  const { count: weeklyCompletions } = await adminClient
    .from('booking_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendorApp.id)
    .eq('status', 'completed')
    .gte('completed_at', startOfWeek.toISOString())

  if (weeklyCompletions && weeklyCompletions > 0) {
    activities.push({
      id: 'weekly-milestone',
      action: 'Weekly bookings completed',
      details: `${weeklyCompletions} booking${weeklyCompletions > 1 ? 's' : ''} completed this week`,
      time: formatTimeAgo(startOfWeek),
      type: 'milestone'
    })
  }

  // Sort by most recent first and limit to 5
  return activities
    .sort((a, b) => {
      // This is a simplified sort - in production you'd want to parse the time strings
      return 0
    })
    .slice(0, 5)
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  }
}

export interface RevenueData {
  month: string
  revenue: number
}

export interface BookingData {
  month: string
  bookings: number
}

export interface DriverPerformanceData {
  driverId: string
  driverName: string
  completedBookings: number
  completionRate: number
  averageRating: number
  hasRatings: boolean
}

export async function getVendorRevenueTrend(period: PeriodType = 'daily'): Promise<Array<{ date: string; label: string; revenue: number }>> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  // Get vendor application
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    return []
  }

  // Determine date range based on period
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Get all completed assignments for this vendor
  const { data: completedAssignments } = await adminClient
    .from('booking_assignments')
    .select('booking_id, business_booking_id, completed_at')
    .eq('vendor_id', vendorApp.id)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)

  if (!completedAssignments || completedAssignments.length === 0) {
    // Return empty trend data with correct structure
    return generateEmptyTrend(period)
  }

  // Fetch booking amounts
  const customerBookingIds = completedAssignments.filter(a => a.booking_id).map(a => a.booking_id)
  const businessBookingIds = completedAssignments.filter(a => a.business_booking_id).map(a => a.business_booking_id)

  const bookingAmounts: Map<string, { amount: number; date: string }> = new Map()

  if (customerBookingIds.length > 0) {
    const { data: customerBookings } = await adminClient
      .from('bookings')
      .select('id, total_price')
      .in('id', customerBookingIds)

    customerBookings?.forEach(b => {
      const assignment = completedAssignments.find(a => a.booking_id === b.id)
      if (assignment?.completed_at) {
        bookingAmounts.set(b.id, {
          amount: Number(b.total_price || 0),
          date: assignment.completed_at
        })
      }
    })
  }

  if (businessBookingIds.length > 0) {
    const { data: businessBookings } = await adminClient
      .from('business_bookings')
      .select('id, total_price')
      .in('id', businessBookingIds)

    businessBookings?.forEach(b => {
      const assignment = completedAssignments.find(a => a.business_booking_id === b.id)
      if (assignment?.completed_at) {
        bookingAmounts.set(b.id, {
          amount: Number(b.total_price || 0),
          date: assignment.completed_at
        })
      }
    })
  }

  const revenueTrend: Array<{ date: string; label: string; revenue: number }> = []

  if (period === 'daily') {
    // Show last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = date.toISOString().split('T')[0]

      const dayRevenue = Array.from(bookingAmounts.values())
        .filter(b => b.date.split('T')[0] === dateStr)
        .reduce((sum, b) => sum + b.amount, 0)

      revenueTrend.push({
        date: dateStr,
        label: format(date, 'EEE'),
        revenue: dayRevenue
      })
    }
  } else if (period === 'weekly') {
    // Show last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const weekRevenue = Array.from(bookingAmounts.values())
        .filter(b => {
          const bookingDate = new Date(b.date)
          return bookingDate >= weekStart && bookingDate <= weekEnd
        })
        .reduce((sum, b) => sum + b.amount, 0)

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

      const monthRevenue = Array.from(bookingAmounts.values())
        .filter(b => {
          const bookingDate = new Date(b.date)
          return bookingDate >= monthStart && bookingDate <= monthEnd
        })
        .reduce((sum, b) => sum + b.amount, 0)

      revenueTrend.push({
        date: monthStart.toISOString().split('T')[0],
        label: format(monthStart, 'MMM'),
        revenue: monthRevenue
      })
    }
  }

  return revenueTrend
}

export async function getVendorBookingTrend(period: PeriodType = 'daily'): Promise<Array<{ date: string; label: string; bookings: number }>> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  // Get vendor application
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    return []
  }

  // Get all completed assignments for this vendor
  const { data: completedAssignments } = await adminClient
    .from('booking_assignments')
    .select('id, completed_at')
    .eq('vendor_id', vendorApp.id)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)

  if (!completedAssignments || completedAssignments.length === 0) {
    return generateEmptyBookingTrend(period)
  }

  const bookingTrend: Array<{ date: string; label: string; bookings: number }> = []

  if (period === 'daily') {
    // Show last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = date.toISOString().split('T')[0]

      const dayBookings = completedAssignments.filter(a =>
        a.completed_at?.split('T')[0] === dateStr
      ).length

      bookingTrend.push({
        date: dateStr,
        label: format(date, 'EEE'),
        bookings: dayBookings
      })
    }
  } else if (period === 'weekly') {
    // Show last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const weekBookings = completedAssignments.filter(a => {
        if (!a.completed_at) return false
        const bookingDate = new Date(a.completed_at)
        return bookingDate >= weekStart && bookingDate <= weekEnd
      }).length

      bookingTrend.push({
        date: weekStart.toISOString().split('T')[0],
        label: `W${8 - i}`,
        bookings: weekBookings
      })
    }
  } else if (period === 'monthly') {
    // Show last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

      const monthBookings = completedAssignments.filter(a => {
        if (!a.completed_at) return false
        const bookingDate = new Date(a.completed_at)
        return bookingDate >= monthStart && bookingDate <= monthEnd
      }).length

      bookingTrend.push({
        date: monthStart.toISOString().split('T')[0],
        label: format(monthStart, 'MMM'),
        bookings: monthBookings
      })
    }
  }

  return bookingTrend
}

function generateEmptyTrend(period: PeriodType): Array<{ date: string; label: string; revenue: number }> {
  const result: Array<{ date: string; label: string; revenue: number }> = []

  if (period === 'daily') {
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      result.push({
        date: date.toISOString().split('T')[0],
        label: format(date, 'EEE'),
        revenue: 0
      })
    }
  } else if (period === 'weekly') {
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i))
      result.push({
        date: weekStart.toISOString().split('T')[0],
        label: `W${8 - i}`,
        revenue: 0
      })
    }
  } else if (period === 'monthly') {
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      result.push({
        date: monthStart.toISOString().split('T')[0],
        label: format(monthStart, 'MMM'),
        revenue: 0
      })
    }
  }

  return result
}

function generateEmptyBookingTrend(period: PeriodType): Array<{ date: string; label: string; bookings: number }> {
  const result: Array<{ date: string; label: string; bookings: number }> = []

  if (period === 'daily') {
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      result.push({
        date: date.toISOString().split('T')[0],
        label: format(date, 'EEE'),
        bookings: 0
      })
    }
  } else if (period === 'weekly') {
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i))
      result.push({
        date: weekStart.toISOString().split('T')[0],
        label: `W${8 - i}`,
        bookings: 0
      })
    }
  } else if (period === 'monthly') {
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      result.push({
        date: monthStart.toISOString().split('T')[0],
        label: format(monthStart, 'MMM'),
        bookings: 0
      })
    }
  }

  return result
}

export async function getAnalyticsData(): Promise<{
  revenueData: RevenueData[]
  bookingData: BookingData[]
  driverPerformance: DriverPerformanceData[]
}> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { revenueData: [], bookingData: [], driverPerformance: [] }
  }

  // Get vendor application
  const { data: vendorApp } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendorApp) {
    return { revenueData: [], bookingData: [], driverPerformance: [] }
  }

  // Calculate last 6 months
  const monthsData: { start: Date; end: Date; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    monthsData.push({ start, end, label })
  }

  // Fetch revenue and booking data for last 6 months
  const revenueData: RevenueData[] = []
  const bookingData: BookingData[] = []

  for (const month of monthsData) {
    // Get completed assignments for this month
    const { data: assignments } = await adminClient
      .from('booking_assignments')
      .select('booking_id, business_booking_id')
      .eq('vendor_id', vendorApp.id)
      .eq('status', 'completed')
      .gte('completed_at', month.start.toISOString())
      .lte('completed_at', month.end.toISOString())

    let monthRevenue = 0
    let monthBookings = 0

    if (assignments && assignments.length > 0) {
      monthBookings = assignments.length

      // Get customer booking totals
      const customerBookingIds = assignments
        .filter(a => a.booking_id)
        .map(a => a.booking_id)

      const businessBookingIds = assignments
        .filter(a => a.business_booking_id)
        .map(a => a.business_booking_id)

      if (customerBookingIds.length > 0) {
        const { data: customerBookings } = await adminClient
          .from('bookings')
          .select('total_price')
          .in('id', customerBookingIds)

        if (customerBookings) {
          monthRevenue += customerBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0)
        }
      }

      if (businessBookingIds.length > 0) {
        const { data: businessBookings } = await adminClient
          .from('business_bookings')
          .select('total_price')
          .in('id', businessBookingIds)

        if (businessBookings) {
          monthRevenue += businessBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0)
        }
      }
    }

    revenueData.push({
      month: month.label,
      revenue: Math.round(monthRevenue * 100) / 100
    })

    bookingData.push({
      month: month.label,
      bookings: monthBookings
    })
  }

  // Get driver performance data
  const { data: drivers } = await supabase
    .from('vendor_drivers')
    .select('id, first_name, last_name')
    .eq('vendor_id', vendorApp.id)
    .eq('is_active', true)

  const driverPerformance: DriverPerformanceData[] = []

  if (drivers) {
    for (const driver of drivers) {
      // Get all assignments for this driver
      const { data: allAssignments } = await adminClient
        .from('booking_assignments')
        .select('id, status, booking_id')
        .eq('vendor_id', vendorApp.id)
        .eq('driver_id', driver.id)

      const totalAssignments = allAssignments?.length || 0
      const completedAssignments = allAssignments?.filter(a => a.status === 'completed') || []
      const completionRate = totalAssignments > 0 ? (completedAssignments.length / totalAssignments) * 100 : 0

      // Get ratings for completed bookings
      const bookingIds = completedAssignments
        .map(a => a.booking_id)
        .filter(Boolean)

      let averageRating = 0
      let hasRatings = false

      if (bookingIds.length > 0) {
        const { data: reviews } = await adminClient
          .from('reviews')
          .select('rating')
          .in('booking_id', bookingIds)

        if (reviews && reviews.length > 0) {
          const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
          averageRating = totalRating / reviews.length
          hasRatings = true
        }
      }

      // Only include drivers with at least 1 completed booking
      if (completedAssignments.length > 0) {
        driverPerformance.push({
          driverId: driver.id,
          driverName: `${driver.first_name} ${driver.last_name}`,
          completedBookings: completedAssignments.length,
          completionRate,
          averageRating: Math.round(averageRating * 10) / 10,
          hasRatings
        })
      }
    }

    // Sort by completed bookings (descending) and limit to top 5
    driverPerformance.sort((a, b) => b.completedBookings - a.completedBookings)
    driverPerformance.splice(5)
  }

  return {
    revenueData,
    bookingData,
    driverPerformance
  }
}
