import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Package, DollarSign, Layers, Hash } from "lucide-react"
import { AnimatedCard } from '@/components/ui/animated-card'
import { getAddons, getAddonCategories, AddonFilters } from "./actions"
import { AddonsTable } from "./components/addons-table"
import { AddonFilters as AddonFiltersComponent } from "./components/addon-filters"
import { CustomPagination } from "@/components/ui/custom-pagination"
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
          <AnimatedCard delay={0.1}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Addons</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{total}</span>
                </div>
                <p className="text-xs text-muted-foreground">Available addon options</p>
              </CardContent>
            </Card>
          </AnimatedCard>
          <AnimatedCard delay={0.2}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Active Addons</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                    <Hash className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">{activeCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">Available for booking</p>
              </CardContent>
            </Card>
          </AnimatedCard>
          <AnimatedCard delay={0.3}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Categories</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20">
                    <Layers className="h-4 w-4 text-sky-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-400">{categoriesCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">Addon groupings</p>
              </CardContent>
            </Card>
          </AnimatedCard>
          <AnimatedCard delay={0.4}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Free Addons</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                    <DollarSign className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">{freeCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">Complimentary options</p>
              </CardContent>
            </Card>
          </AnimatedCard>
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
  )
}
