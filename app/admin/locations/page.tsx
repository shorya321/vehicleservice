import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, MapPin } from 'lucide-react'
import { AnimatedCard } from '@/components/ui/animated-card'
import { LocationTableWithBulk } from './components/location-table-with-bulk'
import { ClientFilters } from './components/client-filters'
import { getLocations, getCountries } from './actions'
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
          <AnimatedCard delay={0.1}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Locations</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{total}</span>
                </div>
                <p className="text-xs text-muted-foreground">All locations</p>
              </CardContent>
            </Card>
          </AnimatedCard>
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
  )
}