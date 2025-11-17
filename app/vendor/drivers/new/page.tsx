import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VendorLayout } from '@/components/layout/vendor-layout'
import { DriverForm } from '../components/driver-form'
import { requireVendor } from '@/lib/auth/user-actions'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Add New Driver | Vendor Dashboard',
  description: 'Add a new driver to your team',
}

export default async function NewDriverPage() {
  const user = await requireVendor()
  const supabase = await createClient()

  // Get vendor application for business name
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('business_name')
    .eq('user_id', user.id)
    .single()

  return (
    <VendorLayout user={user} vendorApplication={vendorApplication}>
      <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendor/drivers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Driver</h1>
          <p className="text-muted-foreground">
            Register a new driver for your fleet
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
          <CardDescription>
            Enter the driver's details to add them to your team. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DriverForm mode="create" />
        </CardContent>
      </Card>
    </div>
    </VendorLayout>
  )
}