import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, MapPin } from 'lucide-react'
import { LocationTableWithBulk } from './components/location-table-with-bulk'
import { ClientFilters } from './components/client-filters'
import { getLocations, getCountries } from './actions'
import { AdminLayout } from '@/components/layout/admin-layout'
import { LocationFilters } from '@/lib/types/location'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Locations - Admin',
  description: 'Manage pickup and dropoff locations',
}

export const dynamic = 'force-dynamic'

interface LocationsPageProps {
  searchParams: Promise<{
    search?: string
    type?: string
    status?: string
    country?: string
    allowPickup?: string
    allowDropoff?: string
    page?: string
  }>
}

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const params = await searchParams

  const filters: LocationFilters = {
    search: params.search,
    type: (params.type as any) || 'all',
    status: (params.status as any) || 'all',
    country: params.country || 'all',
    page: params.page ? parseInt(params.page) : 1,
    limit: 10,
    ...(params.allowPickup && { 
      allowPickup: params.allowPickup === 'true'
    }),
    ...(params.allowDropoff && { 
      allowDropoff: params.allowDropoff === 'true'
    })
  }

  const { locations, total, page, totalPages } = await getLocations(filters)
  const countries = await getCountries()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <MapPin className="h-8 w-8" />
              Locations
            </h1>
            <p className="text-muted-foreground">
              Manage pickup and dropoff locations for your vehicle rental service
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/locations/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Locations
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Locations</CardTitle>
            <CardDescription>
              View and manage all pickup and dropoff locations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClientFilters initialFilters={filters} countries={countries} />
            
            <LocationTableWithBulk locations={locations} />

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * filters.limit!) + 1} to{" "}
                  {Math.min(page * filters.limit!, total)} of {total} locations
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    asChild
                  >
                    <Link
                      href={{
                        pathname: "/admin/locations",
                        query: {
                          ...params,
                          page: page - 1,
                        },
                      }}
                    >
                      Previous
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    asChild
                  >
                    <Link
                      href={{
                        pathname: "/admin/locations",
                        query: {
                          ...params,
                          page: page + 1,
                        },
                      }}
                    >
                      Next
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}