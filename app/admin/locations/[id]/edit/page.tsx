import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { LocationForm } from '../../components/location-form'
import { createClient } from '@/lib/supabase/server'
import { AdminLayout } from '@/components/layout/admin-layout'

export const metadata: Metadata = {
  title: 'Edit Location - Admin',
  description: 'Edit location details',
}

export default async function EditLocationPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Fetch location by ID
  const { data: location, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !location) {
    notFound()
  }

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
            <h1 className="text-3xl font-bold tracking-tight">Edit Location</h1>
            <p className="text-muted-foreground">
              Update location details for {location.name}
            </p>
          </div>
        </div>

        <LocationForm location={location} mode="edit" />
      </div>
    </AdminLayout>
  )
}