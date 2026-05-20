import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getPublishedPosts, getCategoryBySlug, getBlogCategories, getFeaturedPosts } from "@/lib/blog/queries"
import { BlogCard } from "../../components/blog-card"
import { BlogFeaturedSpread } from "../../components/blog-featured-spread"
import { CategoryTabs } from "../../components/category-tabs"
import { BlogMotionCard, BlogMotionSection } from "../../components/blog-motion-wrapper"

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
    title: `${category.name} | Infinia Transfers Blog`,
    description: category.description || `Browse ${category.name} articles on Infinia Transfers Blog`,
  }
}

export default async function BlogCategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const parsedPage = parseInt(resolvedSearchParams.page ?? '', 10)
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const isFirstPage = currentPage === 1

  const [category, { posts, total, totalPages }, categories, featuredPosts] = await Promise.all([
    getCategoryBySlug(slug),
    getPublishedPosts({ page: currentPage, limit: 9, categorySlug: slug }),
    getBlogCategories(),
    isFirstPage ? getFeaturedPosts() : Promise.resolve([]),
  ])

  if (!category) {
    notFound()
  }

  const featuredPost = featuredPosts.find(fp => fp.category?.slug === slug) ?? null
  const gridPosts = featuredPost
    ? posts.filter(p => p.id !== featuredPost.id)
    : posts

  return (
    <div className="bg-[var(--black-void)]">
      {/* Category Hero */}
      <div className="blog-category-hero blog-hero-animate">
        <div className="luxury-container relative z-10">
          <nav aria-label="Breadcrumb" className="blog-hero__eyebrow mb-6">
            <ol className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <li>
                <Link href="/blog" className="hover:text-[var(--gold-text)] transition-colors duration-300">Blog</Link>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-[var(--text-secondary)]">{category.name}</span>
              </li>
            </ol>
          </nav>

          <h1 className="blog-hero__title t-display mb-4">{category.name}</h1>

          {category.description && (
            <p className="blog-hero__subtitle t-body max-w-[600px] mb-4">{category.description}</p>
          )}

          <span className="blog-hero__search inline-flex items-center px-3 py-1 t-meta text-[var(--text-muted)] border border-[var(--gold)]/20 rounded-full">
            {total} {total === 1 ? 'article' : 'articles'}
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <section className="bg-[var(--black-rich)] border-t border-[var(--graphite)] py-6">
        <div className="luxury-container">
          <CategoryTabs categories={categories} />
        </div>
      </section>

      {/* Featured Spread — page 1 only, matching category */}
      {featuredPost && (
        <section className="bg-[var(--black-void)] pt-[clamp(2rem,5vw,3.5rem)]">
          <div className="luxury-container">
            <BlogMotionSection>
              <BlogFeaturedSpread post={featuredPost} />
            </BlogMotionSection>
          </div>
        </section>
      )}

      {/* Article Grid */}
      {(gridPosts.length > 0 || !featuredPost) && (
      <section className="bg-[var(--black-void)] py-[clamp(2rem,5vw,3.5rem)]">
        <div className="luxury-container">
          <div className="mb-12">
            {gridPosts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridPosts.map((post, index) => (
                  <BlogMotionCard key={post.id} index={index}>
                    <BlogCard post={post} />
                  </BlogMotionCard>
                ))}
              </div>
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
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--graphite)] rounded-lg hover:border-[var(--gold)] hover:text-[var(--gold-text)] transition-all duration-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              ) : (
                <span aria-disabled="true" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-muted)]/40 border border-[var(--graphite)]/50 rounded-lg cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </span>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Link
                  key={page}
                  href={`/blog/category/${slug}?page=${page}`}
                  aria-label={`Page ${page}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                  className={`w-11 h-11 flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-300 ${
                    page === currentPage
                      ? 'bg-[var(--gold)] text-[var(--onyx)]'
                      : 'text-[var(--text-secondary)] border border-[var(--graphite)] hover:border-[var(--gold)] hover:text-[var(--gold-text)]'
                  }`}
                >
                  {page}
                </Link>
              ))}

              {currentPage < totalPages ? (
                <Link
                  href={`/blog/category/${slug}?page=${currentPage + 1}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--graphite)] rounded-lg hover:border-[var(--gold)] hover:text-[var(--gold-text)] transition-all duration-300"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span aria-disabled="true" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-muted)]/40 border border-[var(--graphite)]/50 rounded-lg cursor-not-allowed">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </nav>
          )}
        </div>
      </section>
      )}
    </div>
  )
}
