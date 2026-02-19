import { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Users, UserCheck, UserX, UserMinus } from 'lucide-react'
import { AnimatedCard } from '@/components/ui/animated-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DriversTableWithBulk } from './components/drivers-table-with-bulk'
import { getDrivers, getDriverStats } from './actions'
import { requireVendor } from '@/lib/auth/user-actions'

export const metadata: Metadata = {
  title: 'Drivers | Vendor Dashboard',
  description: 'Manage your drivers',
}

export default async function DriversPage() {
  await requireVendor()

  const [driversResult, statsResult] = await Promise.all([
    getDrivers(),
    getDriverStats()
  ])

  const drivers = driversResult.data || []
  const stats = statsResult.data || {
    total: 0,
    active: 0,
    available: 0,
    onLeave: 0,
    inactive: 0
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
          <p className="text-muted-foreground">
            Manage your drivers and their availability
          </p>
        </div>
        <Button asChild>
          <Link href="/vendor/drivers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Driver
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <AnimatedCard delay={0.1}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Total Drivers</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{stats.total}</span>
              </div>
              <p className="text-xs text-muted-foreground">All registered drivers</p>
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard delay={0.2}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Active</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                  <UserCheck className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">{stats.active}</span>
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard delay={0.3}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Available</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20">
                  <UserCheck className="h-4 w-4 text-sky-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-400">{stats.available}</span>
              </div>
              <p className="text-xs text-muted-foreground">Ready for assignments</p>
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard delay={0.4}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">On Leave</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                  <UserMinus className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">{stats.onLeave}</span>
              </div>
              <p className="text-xs text-muted-foreground">Temporarily unavailable</p>
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard delay={0.5}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Inactive</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20">
                  <UserX className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-red-400">{stats.inactive}</span>
              </div>
              <p className="text-xs text-muted-foreground">Not currently working</p>
            </CardContent>
          </Card>
        </AnimatedCard>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Drivers</CardTitle>
          <CardDescription>
            View and manage all your registered drivers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DriversTableWithBulk drivers={drivers} />
        </CardContent>
      </Card>
    </div>
  )
}