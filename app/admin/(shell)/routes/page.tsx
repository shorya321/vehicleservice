import { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/actions"
import { getRoutes } from "./actions"
import { RoutesTableWithBulk } from "./components/routes-table-with-bulk"
import { ClientFilters } from "./components/client-filters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedPage } from "@/components/layout/animated-page"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Plus, Route } from "lucide-react"
import Link from "next/link"
import { PagePagination } from "@/components/admin/ui/page-pagination"
import { FilterToggle } from "@/components/admin/ui/filter-toggle"

export const metadata: Metadata = {
  title: 'Routes - Admin Portal',
  description: 'Manage transfer routes',
}

interface AdminRoutesPageProps {
  searchParams: Promise<{
    search?: string
    originLocationId?: string
    destinationLocationId?: string
    isActive?: string
    isPopular?: string
    page?: string
  }>
}

export default async function AdminRoutesPage({ searchParams }: AdminRoutesPageProps) {
  await requireAdmin()
  
  const params = await searchParams
  const filters = {
    search: params.search,
    originLocationId: params.originLocationId,
    destinationLocationId: params.destinationLocationId,
    isActive: params.isActive === 'true' ? true : params.isActive === 'false' ? false : ('all' as const),
    isPopular: params.isPopular === 'true' ? true : params.isPopular === 'false' ? false : ('all' as const),
    page: params.page ? parseInt(params.page) : 1,
  }

  // Filters the URL sets on top of the defaults; opens the filter panel when above 0.
  const activeFilterCount = [
    params.search,
    params.originLocationId && params.originLocationId !== 'all',
    params.destinationLocationId && params.destinationLocationId !== 'all',
    params.isActive === 'true' || params.isActive === 'false',
    params.isPopular === 'true' || params.isPopular === 'false',
  ].filter(Boolean).length

  const routesData = await getRoutes(filters)

  return (
      <AnimatedPage>
        <Breadcrumb items={[{ label: 'Routes', href: '/admin/routes' }]} />
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Routes</h1>
            <p className="text-muted-foreground mt-1">
              Manage transfer routes between locations
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/routes/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Route
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <AnimatedCard delay={0.1}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Routes</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                    <Route className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-700 dark:text-sky-400">{routesData.total}</span>
                </div>
                <p className="text-xs text-muted-foreground">All routes</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>

        <Card>
          <CardHeader>
            <FilterToggle
              activeCount={activeFilterCount}
              header={
                <div className="space-y-1.5">
                  <CardTitle>All Routes</CardTitle>
                  <CardDescription>View and manage all transfer routes</CardDescription>
                </div>
              }
            >
              <ClientFilters initialFilters={filters} />
            </FilterToggle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RoutesTableWithBulk routes={routesData.routes} />

            <PagePagination pathname="/admin/routes" page={routesData.page} totalPages={routesData.totalPages} total={routesData.total} limit={routesData.limit} noun="routes" query={params} />
          </CardContent>
        </Card>
      </AnimatedPage>
  )
}