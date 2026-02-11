import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Eye, PenLine, Star } from "lucide-react"
import { getBlogPosts, BlogPostFilters } from "./actions"
import { BlogPostsTable } from "./components/blog-posts-table"
import { BlogPostFilters as BlogPostFiltersComponent } from "./components/blog-post-filters"
import { CustomPagination } from "@/components/ui/custom-pagination"
import { getAllBlogCategories } from "../categories/actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Blog Posts | Admin",
  description: "Manage blog posts",
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    categoryId?: string
    status?: string
    page?: string
  }>
}

export default async function BlogPostsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const categories = await getAllBlogCategories()

  const filters: BlogPostFilters = {
    search: resolvedSearchParams.search,
    categoryId: resolvedSearchParams.categoryId,
    status: resolvedSearchParams.status,
    page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1,
    limit: 10,
  }

  const { posts, total, page, totalPages } = await getBlogPosts(filters)

  const publishedCount = posts.filter(p => p.status === 'published').length
  const draftCount = posts.filter(p => p.status === 'draft').length
  const featuredCount = posts.filter(p => p.is_featured).length
  const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">
            Create and manage blog content
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/posts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">All blog posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <PenLine className="h-4 w-4 text-[var(--admin-success)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
            <p className="text-xs text-muted-foreground">Live posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="h-4 w-4 text-[var(--admin-warning)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
            <p className="text-xs text-muted-foreground">Unpublished posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">Across all posts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts</CardTitle>
          <CardDescription>
            Manage your blog content and publishing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BlogPostFiltersComponent categories={categories} />
          <BlogPostsTable posts={posts} />
          {totalPages > 1 && (
            <div className="flex justify-center">
              <CustomPagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/admin/blog/posts"
                searchParams={resolvedSearchParams}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
