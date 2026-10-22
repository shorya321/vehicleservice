import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Tag, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getLocationTypesAdmin, getLocationTypeStats } from './actions'
import { LocationTypesTable } from './components/location-types-table'
import { PagePagination } from '@/components/admin/ui/page-pagination'
import { FilterToggle } from '@/components/admin/ui/filter-toggle'
import { StatCard } from '@/components/admin/ui/stat-card'
import { SearchStatusFilters } from '@/components/admin/ui/search-status-filters'

const PAGE_LIMIT = 10

export const metadata: Metadata = {
  title: 'Location Types | Admin',
}

interface LocationTypesPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function LocationTypesPage({ searchParams }: LocationTypesPageProps) {
  const params = await searchParams
  // Filters the URL sets on top of the defaults; opens the filter panel when above 0.
  const activeFilterCount = [
    params.search,
    params.status && params.status !== 'all',
  ].filter(Boolean).length

  const filters = {
    search: params.search,
    status: params.status,
    page: params.page ? parseInt(params.page) : 1,
  }

  const [result, stats] = await Promise.all([
    getLocationTypesAdmin(filters),
    getLocationTypeStats(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Location Types</h1>
          <p className="text-muted-foreground">
            Manage location type categories for your service areas
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/location-types/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Type
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total Types"
          value={stats.total}
          hint="All location types"
          icon={Tag}
          tone={{ disc: 'bg-primary/20', icon: 'text-primary', value: 'text-sky-700 dark:text-sky-400' }}
          delay={0.1}
        />
        <StatCard
          label="Active"
          value={stats.active}
          hint="Enabled types"
          icon={CheckCircle}
          tone={{ disc: 'bg-emerald-500/20', icon: 'text-emerald-500', value: 'text-emerald-700 dark:text-emerald-400' }}
          delay={0.2}
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          hint="Disabled types"
          icon={XCircle}
          tone={{ disc: 'bg-red-500/20', icon: 'text-red-500', value: 'text-red-700 dark:text-red-400' }}
          delay={0.3}
        />
      </div>

      <Card>
        <CardHeader>
          <FilterToggle
            activeCount={activeFilterCount}
            header={
              <div className="space-y-1.5">
                <CardTitle>All Location Types</CardTitle>
                <CardDescription>View and manage location types</CardDescription>
              </div>
            }
          >
            <SearchStatusFilters searchPlaceholder="Search by label or name" searchLabel="Search location types" />
          </FilterToggle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocationTypesTable locationTypes={result.locationTypes} />

          <PagePagination pathname="/admin/location-types" page={result.page} totalPages={result.totalPages} total={result.total} limit={PAGE_LIMIT} noun="location types" query={params} />
        </CardContent>
      </Card>
    </div>
  )
}
