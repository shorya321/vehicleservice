import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getPublishedPosts, getCategoryBySlug, getBlogCategories } from "@/lib/blog/queries"
import { BlogHero } from "../../components/blog-hero"
import { BlogCard } from "../../components/blog-card"
import { CategoryTabs } from "../../components/category-tabs"
import { BlogMotionCard } from "../../components/blog-motion-wrapper"

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
    <div className="bg-[var(--black-void)]">
      <BlogHero
        title={category.name}
        subtitle={category.description || undefined}
        eyebrow="Blog Category"
      />

      {/* Posts — raised */}
      <section className="editorial-section editorial-section--raised bg-[var(--black-rich)] border-t border-[var(--graphite)]">
        <div className="luxury-container">
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
          <div className="mb-8">
            <CategoryTabs categories={categories} />
          </div>

          {/* Posts Grid */}
          <div className="mb-12">
            {posts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post, index) => (
                  <BlogMotionCard key={post.id} index={index}>
                    <BlogCard post={post} />
                  </BlogMotionCard>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-[var(--charcoal)] border border-[var(--gold)]/20 flex items-center justify-center">
                  <span className="text-[var(--gold)]/40 text-2xl font-serif">?</span>
                </div>
                <h3 className="t-subhead mb-2">
                  No articles in this category
                </h3>
                <p className="t-meta max-w-md mx-auto mb-6">
                  We haven&apos;t published any articles in &ldquo;{category.name}&rdquo; yet. Browse other categories or check back soon.
                </p>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold tracking-[0.08em] uppercase text-[var(--onyx)] bg-[var(--gold)] rounded-[4px] hover:bg-[var(--gold-deep)] transition-colors duration-300"
                >
                  Browse All Articles
                </Link>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-4">
              {currentPage > 1 ? (
                <Link
                  href={`/blog/category/${slug}?page=${currentPage - 1}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-[4px] hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              ) : <span />}
              <span className="t-meta text-[var(--text-muted)]">
                Page <span className="t-numeric">{currentPage}</span> of <span className="t-numeric">{totalPages}</span>
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={`/blog/category/${slug}?page=${currentPage + 1}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-[4px] hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-300"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : <span />}
            </nav>
          )}
        </div>
      </section>
    </div>
  )
}
