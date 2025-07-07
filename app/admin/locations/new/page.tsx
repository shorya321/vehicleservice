import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { LocationForm } from '../components/location-form'
import { AdminLayout } from '@/components/layout/admin-layout'

export const metadata: Metadata = {
  title: 'New Location - Admin',
  description: 'Create a new location',
}

export default function NewLocationPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/locations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Location</h1>
            <p className="text-muted-foreground">
              Create a new pickup or dropoff location
            </p>
          </div>
        </div>

        <LocationForm mode="create" />
      </div>
    </AdminLayout>
  )
}