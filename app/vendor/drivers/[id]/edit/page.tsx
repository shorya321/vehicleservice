import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DriverForm } from '../../components/driver-form'
import { getDriver } from '../../actions'
import { requireVendor } from '@/lib/auth/user-actions'

export const metadata: Metadata = {
  title: 'Edit Driver | Vendor Dashboard',
  description: 'Update driver information',
}

interface EditDriverPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditDriverPage({ params }: EditDriverPageProps) {
  const { id } = await params
  await requireVendor()

  const { data: driver, error } = await getDriver(id)

  if (error || !driver) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendor/drivers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Driver</h1>
          <p className="text-muted-foreground">
            Update driver information for {driver.first_name} {driver.last_name}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
          <CardDescription>
            Update the driver&apos;s details. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DriverForm driver={driver} mode="edit" />
        </CardContent>
      </Card>
    </div>
  )
}