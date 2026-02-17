import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, FolderOpen } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
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
        <AnimatedCard delay={0.1}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Total Categories</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                  <FolderOpen className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{total}</span>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard delay={0.2}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Active</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                  <FolderOpen className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
                  {categories.filter(c => c.is_active).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>
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
