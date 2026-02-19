import { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/actions"
import { getRoutes } from "./actions"
import { RoutesTableWithBulk } from "./components/routes-table-with-bulk"
import { ClientFilters } from "./components/client-filters"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedCard } from "@/components/ui/animated-card"
import { Plus, Route } from "lucide-react"
import Link from "next/link"

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
    isActive: params.isActive === 'true' ? true : params.isActive === 'false' ? false : 'all',
    isPopular: params.isPopular === 'true' ? true : params.isPopular === 'false' ? false : 'all',
    page: params.page ? parseInt(params.page) : 1,
  }

  const routesData = await getRoutes(filters)

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Routes</h1>
            <p className="text-muted-foreground mt-1">
              Manage transfer routes between locations
            </p>
          </div>
          <Button asChild>
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
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{routesData.total}</span>
                </div>
                <p className="text-xs text-muted-foreground">All routes</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>

        <div className="space-y-4">
          <ClientFilters initialFilters={filters} />
          <RoutesTableWithBulk routes={routesData.routes} pagination={routesData} />
        </div>
      </div>
  )
}