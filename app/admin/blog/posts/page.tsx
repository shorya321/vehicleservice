import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Eye, PenLine, Star } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
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
        <AnimatedCard delay={0.1}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Total Posts</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{total}</span>
              </div>
              <p className="text-xs text-muted-foreground">All blog posts</p>
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard delay={0.2}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Published</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                  <PenLine className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">{publishedCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Live posts</p>
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard delay={0.3}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Drafts</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                  <FileText className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">{draftCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Unpublished posts</p>
            </CardContent>
          </Card>
        </AnimatedCard>
        <AnimatedCard delay={0.4}>
          <Card className="admin-card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Total Views</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20">
                  <Eye className="h-4 w-4 text-sky-500" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-400">{totalViews}</span>
              </div>
              <p className="text-xs text-muted-foreground">Across all posts</p>
            </CardContent>
          </Card>
        </AnimatedCard>
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
