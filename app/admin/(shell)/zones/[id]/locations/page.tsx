import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LocationAssignment } from '../../components/location-assignment'
import { getZone } from '../../actions'
import { getLocationsWithZones } from './actions'
import { PagePagination } from '@/components/admin/ui/page-pagination'

export const metadata: Metadata = {
  title: 'Zone Locations | Admin',
  description: 'Manage location assignments for zone',
}

interface ZoneLocationsPageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    search?: string
    zoneFilter?: string
    page?: string
  }>
}

export default async function ZoneLocationsPage({ params, searchParams }: ZoneLocationsPageProps) {
  const { id } = await params
  const queryParams = await searchParams

  const filters = {
    search: queryParams.search,
    zoneFilter: queryParams.zoneFilter,
    page: queryParams.page ? parseInt(queryParams.page) : 1,
  }

  const [zone, locationsData] = await Promise.all([
    getZone(id),
    getLocationsWithZones(filters)
  ])

  if (!zone) {
    notFound()
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/zones">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div className="space-y-2">
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
          locations={locationsData.locations}
          currentSearch={queryParams.search || ''}
          currentZoneFilter={queryParams.zoneFilter || 'all'}
        />

        <PagePagination pathname={`/admin/zones/${id}/locations`} page={locationsData.page} totalPages={locationsData.totalPages} total={locationsData.total} limit={locationsData.limit} noun="locations" query={queryParams} />
      </div>
  )
}
