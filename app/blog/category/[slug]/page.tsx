import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getPublishedPosts, getCategoryBySlug, getBlogCategories } from "@/lib/blog/queries"
import { BlogHero } from "../../components/blog-hero"
import { BlogCard } from "../../components/blog-card"
import { CategoryTabs } from "../../components/category-tabs"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    return { title: "Category Not Found" }
  }

  return {
    title: `${category.name} | VehicleService Blog`,
    description: category.description || `Browse ${category.name} articles on VehicleService Blog`,
  }
}

export default async function BlogCategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const currentPage = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1

  const [category, { posts, totalPages }, categories] = await Promise.all([
    getCategoryBySlug(slug),
    getPublishedPosts({ page: currentPage, limit: 9, categorySlug: slug }),
    getBlogCategories(),
  ])

  if (!category) {
    notFound()
  }

  return (
    <div className="bg-[var(--black-void)] min-h-screen">
      <BlogHero
        title={category.name}
        subtitle={category.description || undefined}
        eyebrow="Blog Category"
      />

      <div className="luxury-container py-10 md:py-16">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors duration-300"
          >
            <ChevronLeft className="h-4 w-4" />
            All Posts
          </Link>
        </div>

        {/* Category Tabs */}
        <section className="mb-8">
          <CategoryTabs categories={categories} />
        </section>

        {/* Posts Grid */}
        <section className="mb-12">
          {posts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[var(--text-muted)] text-lg">
                No posts in this category yet.
              </p>
            </div>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-4 pb-8">
            {currentPage > 1 ? (
              <Link
                href={`/blog/category/${slug}?page=${currentPage - 1}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-full hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            ) : <span />}
            <span className="text-sm text-[var(--text-muted)]">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link
                href={`/blog/category/${slug}?page=${currentPage + 1}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-full hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-300"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : <span />}
          </nav>
        )}
      </div>
    </div>
  )
}
