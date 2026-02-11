import { Metadata } from 'next'
import { VendorLayout } from '@/components/layout/vendor-layout'
import { requireVendor } from '@/lib/auth/user-actions'
import { createClient } from '@/lib/supabase/server'
import { getVendorCalendarEvents, getVendorResources } from './actions'
import { AvailabilityCalendar } from './components/availability-calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Availability Calendar - Vendor',
  description: 'Manage vehicle and driver availability',
}

export default async function VendorAvailabilityPage() {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application for business name
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('business_name')
    .eq('user_id', user.id)
    .single()

  // Get initial data
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [events, resources] = await Promise.all([
    getVendorCalendarEvents(startOfMonth.toISOString(), endOfMonth.toISOString()),
    getVendorResources()
  ])

  return (
    <VendorLayout user={user} vendorApplication={vendorApplication}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Availability Calendar</h1>
          <p className="text-muted-foreground">
            View and manage vehicle and driver schedules
          </p>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Schedule</CardTitle>
            <CardDescription>
              Click on events to view details. Drag to create unavailability periods.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvailabilityCalendar
              initialEvents={events}
              vehicles={resources.vehicles}
              drivers={resources.drivers}
            />
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  )
}