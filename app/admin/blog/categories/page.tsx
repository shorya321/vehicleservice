import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, FolderOpen } from "lucide-react"
import { getBlogCategories, BlogCategoryFilters } from "./actions"
import { BlogCategoriesTable } from "./components/categories-table"
import { CustomPagination } from "@/components/ui/custom-pagination"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Blog Categories | Admin",
  description: "Manage blog categories",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
  }>
}

export default async function BlogCategoriesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams

  const filters: BlogCategoryFilters = {
    search: resolvedSearchParams.search,
    page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1,
    limit: 10,
  }

  const { categories, total, page, totalPages } = await getBlogCategories(filters)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Categories</h1>
          <p className="text-muted-foreground">
            Organize your blog posts into categories
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/categories/new">
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <FolderOpen className="h-4 w-4 text-[var(--admin-success)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter(c => c.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>Manage blog categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BlogCategoriesTable categories={categories} />
          {totalPages > 1 && (
            <div className="flex justify-center">
              <CustomPagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/admin/blog/categories"
                searchParams={resolvedSearchParams}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
