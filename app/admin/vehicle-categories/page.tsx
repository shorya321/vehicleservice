import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Tag } from 'lucide-react'
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
import { Pagination } from '@/components/ui/pagination'

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

  const { categories, total, page, totalPages } = await getCategories(filters)
  
  // Get usage count for each category
  const categoriesWithUsage = await Promise.all(
    categories.map(async (category) => {
      const usage_count = await getCategoryUsageCount(category.id)
      return { ...category, usage_count }
    })
  )

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Categories</h1>
            <p className="text-muted-foreground">
              Manage categories for vehicle classification
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/vehicle-categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Categories
              </CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">
                Active vehicle categories
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
            <CardDescription>
              View and manage vehicle categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClientFilters />
            <CategoryTableWithBulk categories={categoriesWithUsage} />
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  baseUrl="/admin/vehicle-categories"
                  queryParams={params}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  )
}