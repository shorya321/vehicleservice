import { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Users, UserCheck, UserX, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VendorLayout } from '@/components/layout/vendor-layout'
import { DriversTable } from './components/drivers-table'
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
    <VendorLayout>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All registered drivers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.available}</div>
            <p className="text-xs text-muted-foreground">
              Ready for assignments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <UserMinus className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onLeave}</div>
            <p className="text-xs text-muted-foreground">
              Temporarily unavailable
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <UserX className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Not currently working
            </p>
          </CardContent>
        </Card>
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
          <DriversTable drivers={drivers} />
        </CardContent>
      </Card>
    </div>
    </VendorLayout>
  )
}