import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Tag } from 'lucide-react'
import { AnimatedCard } from '@/components/ui/animated-card'
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
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{total}</span>
                </div>
                <p className="text-xs text-muted-foreground">Active vehicle categories</p>
              </CardContent>
            </Card>
          </AnimatedCard>
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