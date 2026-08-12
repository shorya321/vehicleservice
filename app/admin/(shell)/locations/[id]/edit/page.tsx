import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { LocationForm } from '../../components/location-form'
import { createClient } from '@/lib/supabase/server'
import { getActiveLocationTypes } from '@/lib/actions/location-types'
import { LocationTypeRecord } from '@/lib/types/location-type'

export const metadata: Metadata = {
  title: 'Edit Location - Admin',
  description: 'Edit location details',
}

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch location by ID with location_types join
  const [{ data: location, error }, activeLocationTypes] = await Promise.all([
    supabase
      .from('locations')
      .select('*, location_types(*)')
      .eq('id', id)
      .single(),
    getActiveLocationTypes(),
  ])

  if (error || !location) {
    notFound()
  }

  // Ensure the location's current type is in the list even if deactivated
  const currentTypeInList = activeLocationTypes.some(
    (lt) => lt.id === location.location_type_id
  )
  const locationTypes = currentTypeInList || !location.location_types
    ? activeLocationTypes
    : [location.location_types as unknown as LocationTypeRecord, ...activeLocationTypes]

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
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

        <LocationForm location={location} mode="edit" locationTypes={locationTypes} />
      </div>
  )
}