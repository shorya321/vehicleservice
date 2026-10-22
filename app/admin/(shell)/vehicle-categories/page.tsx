import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Tag } from 'lucide-react'
import { AnimatedCard } from '@/components/ui/animated-card'
import { AnimatedPage } from '@/components/layout/animated-page'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { CategoryTableWithBulk } from './components/category-table-with-bulk'
import { ClientFilters } from './components/client-filters'
import { getCategories, getCategoryUsageCount, CategoryFilters } from './actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CustomPagination } from '@/components/ui/custom-pagination'
import { FilterToggle } from '@/components/admin/ui/filter-toggle'

export const metadata: Metadata = {
  title: 'Vehicle Categories - Admin',
  description: 'Manage vehicle categories',
}

interface VehicleCategoriesPageProps {
  searchParams: Promise<{
    search?: string
    page?: string
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function VehicleCategoriesPage({ searchParams }: VehicleCategoriesPageProps) {
  const params = await searchParams

  const filters: CategoryFilters = {
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
    limit: 10,
    sortBy: (params.sortBy as any) || 'sort_order',
    sortOrder: (params.sortOrder as any) || 'asc',
  }

  // Filters the URL sets on top of the defaults; opens the filter panel when above 0.
  // Sort is one control writing both sortBy and sortOrder, so it counts once.
  const activeFilterCount = [
    params.search,
    (params.sortBy && params.sortBy !== 'sort_order') || (params.sortOrder && params.sortOrder !== 'asc'),
  ].filter(Boolean).length

  const { categories, total, page, totalPages } = await getCategories(filters)
  
  // Get usage count for each category
  const categoriesWithUsage = await Promise.all(
    categories.map(async (category) => {
      const usage_count = await getCategoryUsageCount(category.id)
      return { ...category, usage_count }
    })
  )

  return (
      <AnimatedPage>
        <Breadcrumb items={[{ label: 'Vehicle Categories', href: '/admin/vehicle-categories' }]} />
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Categories</h1>
            <p className="text-muted-foreground">
              Manage categories for vehicle classification
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/vehicle-categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <AnimatedCard delay={0.1}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Categories</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-700 dark:text-sky-400">{total}</span>
                </div>
                <p className="text-xs text-muted-foreground">Active vehicle categories</p>
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
                  <CardTitle>All Categories</CardTitle>
                  <CardDescription>
                    View and manage vehicle categories
                  </CardDescription>
                </div>
              }
            >
              <ClientFilters />
            </FilterToggle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CategoryTableWithBulk categories={categoriesWithUsage} />
            {totalPages > 1 && (
              <div className="flex justify-center">
                <CustomPagination
                  currentPage={page}
                  totalPages={totalPages}
                  baseUrl="/admin/vehicle-categories"
                  queryParams={params}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedPage>
  )
}