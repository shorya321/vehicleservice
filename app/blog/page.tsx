import { Metadata } from "next"
import Link from "next/link"

export const dynamic = 'force-dynamic'
import { getPublishedPosts, getBlogCategories, getPopularTags, getFeaturedPosts } from "@/lib/blog/queries"
import { BlogCard } from "./components/blog-card"
import { BlogFeaturedSpread } from "./components/blog-featured-spread"
import { CategoryTabs } from "./components/category-tabs"
import { BlogMotionCard, BlogMotionSection } from "./components/blog-motion-wrapper"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog | Infinia Transfers - Luxury Transportation Insights",
  description: "Discover travel tips, luxury transportation insights, and destination guides from Infinia Transfers.",
  openGraph: {
    title: "Blog | Infinia Transfers",
    description: "Luxury transportation insights and travel guides",
    type: "website",
  },
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export default async function BlogPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const parsedPage = parseInt(resolvedSearchParams.page ?? '', 10)
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const isFirstPage = currentPage === 1 && !resolvedSearchParams.search

  const [{ posts, total, totalPages }, categories, popularTags, featuredPosts] = await Promise.all([
    getPublishedPosts({ page: currentPage, limit: 9, search: resolvedSearchParams.search }),
    getBlogCategories(),
    getPopularTags(),
    isFirstPage ? getFeaturedPosts() : Promise.resolve([]),
  ])

  const featuredPost = featuredPosts[0] ?? null
  const gridPosts = featuredPost
    ? posts.filter(p => p.id !== featuredPost.id)
    : posts

  return (
    <div className="bg-[var(--black-void)]">
      <a href="#blog-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--gold)] focus:text-[var(--onyx)] focus:rounded-[4px] focus:text-sm focus:font-medium">
        Skip to articles
      </a>

      {/* Hero */}
      <div className="blog-category-hero blog-hero-animate">
        <div className="luxury-container relative z-10">
          <div className="blog-hero__eyebrow flex items-center gap-3 mb-6" aria-hidden="true">
            <span className="w-6 h-px bg-[var(--gold)]" />
            <span className="t-label-accent">Journal</span>
            <span className="w-6 h-px bg-[var(--gold)]" />
          </div>
          <h1 className="blog-hero__title t-display mb-4">Our Blog</h1>
          <p className="blog-hero__subtitle t-body max-w-[600px] mb-6">
            Travel insights, destination guides, and what goes into getting you there well.
          </p>
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

      {/* Featured Spread — page 1 only */}
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
      <section id="blog-content" className="bg-[var(--black-void)] py-[clamp(2rem,5vw,3.5rem)]">
        <div className="luxury-container">
          {featuredPost && gridPosts.length > 0 && (
            <div className="flex items-center gap-3 mb-8">
              <span className="w-6 h-px bg-[var(--gold)]" aria-hidden="true" />
              <h2 className="t-label-accent">Latest Articles</h2>
            </div>
          )}

          <div className="mb-12">
            {gridPosts.length > 0 ? (
              <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6${gridPosts.length >= 3 ? ' lg:[&>:first-child]:col-span-2' : ''}`}>
                {gridPosts.map((post, index) => (
                  <BlogMotionCard key={post.id} index={index}>
                    <BlogCard post={post} />
                  </BlogMotionCard>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-[var(--charcoal)] border border-[var(--gold)]/20 flex items-center justify-center">
                  <Search className="w-6 h-6 text-[var(--gold)]/40" />
                </div>
                <h2 className="t-subhead mb-2">
                  {resolvedSearchParams.search ? 'No results found' : 'No articles yet'}
                </h2>
                <p className="t-meta max-w-md mx-auto">
                  {resolvedSearchParams.search
                    ? `We couldn't find any articles matching "${resolvedSearchParams.search}". Try a different search term.`
                    : 'Check back soon for new articles and insights.'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={`/blog?page=${currentPage - 1}${resolvedSearchParams.search ? `&search=${encodeURIComponent(resolvedSearchParams.search)}` : ''}`}
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
                  href={`/blog?page=${page}${resolvedSearchParams.search ? `&search=${encodeURIComponent(resolvedSearchParams.search)}` : ''}`}
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
                  href={`/blog?page=${currentPage + 1}${resolvedSearchParams.search ? `&search=${encodeURIComponent(resolvedSearchParams.search)}` : ''}`}
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

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <section className="editorial-section editorial-section--ground bg-[var(--black-void)]" aria-label="Popular topics">
          <div className="luxury-container">
            <BlogMotionSection className="flex items-center gap-3 mb-8">
              <span className="w-6 h-px bg-[var(--gold)]" aria-hidden="true" />
              <h2 className="t-label-accent">Popular Topics</h2>
            </BlogMotionSection>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog/tag/${tag.slug}`}
                  className="px-5 py-2.5 min-h-[44px] flex items-center text-sm text-[var(--text-secondary)] border border-[var(--graphite)] rounded-lg hover:border-[var(--gold)] hover:text-[var(--gold-text)] transition-all duration-300"
                >
                  {tag.name}
                  <span className="ml-1 text-[var(--text-muted)]">({tag.count})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
