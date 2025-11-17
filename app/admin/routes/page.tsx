import { Metadata } from "next"
import { AdminLayout } from "@/components/layout/admin-layout"
import { requireAdmin } from "@/lib/auth/actions"
import { getRoutes } from "./actions"
import { RoutesTableWithBulk } from "./components/routes-table-with-bulk"
import { ClientFilters } from "./components/client-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: 'Routes - Admin Portal',
  description: 'Manage transfer routes',
}

export const dynamic = 'force-dynamic'

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
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
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

        <div className="space-y-4">
          <ClientFilters initialFilters={filters} />
          <RoutesTableWithBulk routes={routesData.routes} pagination={routesData} />
        </div>
      </div>
    </AdminLayout>
  )
}