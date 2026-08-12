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
          locations={locationsData.locations}
          currentSearch={queryParams.search || ''}
          currentZoneFilter={queryParams.zoneFilter || 'all'}
        />

        {locationsData.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((locationsData.page - 1) * locationsData.limit) + 1} to{' '}
              {Math.min(locationsData.page * locationsData.limit, locationsData.total)} of {locationsData.total} locations
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={locationsData.page === 1}
                asChild
              >
                <Link
                  href={{
                    pathname: `/admin/zones/${id}/locations`,
                    query: { ...queryParams, page: locationsData.page - 1 },
                  }}
                >
                  Previous
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={locationsData.page === locationsData.totalPages}
                asChild
              >
                <Link
                  href={{
                    pathname: `/admin/zones/${id}/locations`,
                    query: { ...queryParams, page: locationsData.page + 1 },
                  }}
                >
                  Next
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
  )
}
