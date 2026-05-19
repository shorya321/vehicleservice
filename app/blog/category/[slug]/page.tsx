import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getPublishedPosts, getCategoryBySlug, getBlogCategories } from "@/lib/blog/queries"
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

  const [category, { posts, total, totalPages }, categories] = await Promise.all([
    getCategoryBySlug(slug),
    getPublishedPosts({ page: currentPage, limit: 9, categorySlug: slug }),
    getBlogCategories(),
  ])

  if (!category) {
    notFound()
  }

  return (
    <div className="bg-[var(--black-void)]">
      {/* Category Hero — warm-tinted */}
      <div className="blog-category-hero">
        <div className="luxury-container relative z-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
            <Link
              href="/blog"
              className="hover:text-[var(--gold)] transition-colors duration-300"
            >
              Blog
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-[var(--text-secondary)]">{category.name}</span>
          </nav>

          {/* Category name */}
          <h1 className="t-display mb-4">{category.name}</h1>

          {/* Description */}
          {category.description && (
            <p className="t-body max-w-[600px] mb-4">{category.description}</p>
          )}

          {/* Post count */}
          <span className="inline-flex items-center px-3 py-1 t-meta text-[var(--text-muted)] border border-[var(--gold)]/20 rounded-full">
            {total} {total === 1 ? 'article' : 'articles'}
          </span>
        </div>
      </div>

      {/* Category Tabs — own section, bg-rich */}
      <section className="bg-[var(--black-rich)] border-t border-[var(--graphite)] py-6">
        <div className="luxury-container">
          <CategoryTabs categories={categories} />
        </div>
      </section>

      {/* Posts — void bg, tighter padding */}
      <section className="bg-[var(--black-void)] py-[clamp(2rem,5vw,3.5rem)]">
        <div className="luxury-container">
          {/* Posts Grid */}
          <div className="mb-12">
            {posts.length > 0 ? (
              currentPage === 1 ? (
                <div className="blog-magazine-grid">
                  {posts.map((post, index) => (
                    <BlogMotionCard key={post.id} index={index}>
                      <BlogCard post={post} magazine={index === 0} />
                    </BlogMotionCard>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post, index) => (
                    <BlogMotionCard key={post.id} index={index}>
                      <BlogCard post={post} />
                    </BlogMotionCard>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-[var(--charcoal)] border border-[var(--gold)]/20 flex items-center justify-center">
                  <span className="text-[var(--gold)]/40 text-2xl font-sans font-medium">?</span>
                </div>
                <h2 className="t-subhead mb-2">No articles in this category</h2>
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
            <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={`/blog/category/${slug}?page=${currentPage - 1}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--graphite)] rounded-lg hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all duration-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              ) : <span />}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Link
                  key={page}
                  href={`/blog/category/${slug}?page=${page}`}
                  className={`w-11 h-11 flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-300 ${
                    page === currentPage
                      ? 'bg-[var(--gold)] text-[var(--onyx)]'
                      : 'text-[var(--text-secondary)] border border-[var(--graphite)] hover:border-[var(--gold)] hover:text-[var(--gold)]'
                  }`}
                >
                  {page}
                </Link>
              ))}

              {currentPage < totalPages ? (
                <Link
                  href={`/blog/category/${slug}?page=${currentPage + 1}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--graphite)] rounded-lg hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all duration-300"
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
