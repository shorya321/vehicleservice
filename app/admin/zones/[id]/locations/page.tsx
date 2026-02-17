import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LocationAssignment } from '../../components/location-assignment'
import { getZone } from '../../actions'
import { getLocationsWithZones } from './actions'

export const metadata: Metadata = {
  title: 'Zone Locations | Admin',
  description: 'Manage location assignments for zone',
}

interface ZoneLocationsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ZoneLocationsPage({ params }: ZoneLocationsPageProps) {
  const { id } = await params
  const [zone, locations] = await Promise.all([
    getZone(id),
    getLocationsWithZones()
  ])

  if (!zone) {
    notFound()
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/zones/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {zone.name} - Location Assignment
            </h1>
            <p className="text-muted-foreground">
              Assign locations to this pricing zone
            </p>
          </div>
        </div>

        <LocationAssignment
          zone={zone}
          locations={locations}
        />
      </div>
  )
}