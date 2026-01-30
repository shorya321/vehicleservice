import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Package, DollarSign, Layers, Hash } from "lucide-react"
import { getAddons, getAddonCategories, AddonFilters } from "./actions"
import { AddonsTable } from "./components/addons-table"
import { AddonFilters as AddonFiltersComponent } from "./components/addon-filters"
import { CustomPagination } from "@/components/ui/custom-pagination"
import { AdminLayout } from '@/components/layout/admin-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: "Addons | Admin",
  description: "Manage booking addons",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    isActive?: string
    page?: string
  }>
}

export default async function AddonsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const categories = await getAddonCategories()

  const filters: AddonFilters = {
    search: resolvedSearchParams.search,
    category: resolvedSearchParams.category,
    isActive: resolvedSearchParams.isActive === 'true' ? true : resolvedSearchParams.isActive === 'false' ? false : 'all',
    page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1,
    limit: 10,
  }

  const { addons, total, page, totalPages } = await getAddons(filters)

  // Stats
  const activeCount = addons.filter(a => a.is_active).length
  const categoriesCount = new Set(addons.map(a => a.category)).size
  const avgPrice = addons.length > 0
    ? addons.reduce((sum, a) => sum + Number(a.price), 0) / addons.length
    : 0
  const freeCount = addons.filter(a => Number(a.price) === 0).length

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Addons</h1>
            <p className="text-muted-foreground">
              Manage booking addons for customers and businesses
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/addons/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Addon
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Addons
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">
                Available addon options
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Addons
              </CardTitle>
              <Hash className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-muted-foreground">
                Available for booking
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Categories
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoriesCount}</div>
              <p className="text-xs text-muted-foreground">
                Addon groupings
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Free Addons
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{freeCount}</div>
              <p className="text-xs text-muted-foreground">
                Complimentary options
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Addons</CardTitle>
            <CardDescription>
              Configure addons for both customer and business bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddonFiltersComponent categories={categories} />
            <AddonsTable addons={addons} />
            {totalPages > 1 && (
              <div className="flex justify-center">
                <CustomPagination
                  currentPage={page}
                  totalPages={totalPages}
                  baseUrl="/admin/addons"
                  queryParams={resolvedSearchParams}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
