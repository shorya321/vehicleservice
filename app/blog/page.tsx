import { Metadata } from "next"
import Link from "next/link"

export const dynamic = 'force-dynamic'
import { getPublishedPosts, getBlogCategories, getPopularTags } from "@/lib/blog/queries"
import { BlogNewsletterCta } from "./components/blog-newsletter-cta"
import { BlogCard } from "./components/blog-card"
import { CategoryTabs } from "./components/category-tabs"
import { BlogMotionCard, BlogMotionSection } from "./components/blog-motion-wrapper"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog | VehicleService - Luxury Transportation Insights",
  description: "Discover travel tips, luxury transportation insights, and destination guides from VehicleService.",
  openGraph: {
    title: "Blog | VehicleService",
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
  const currentPage = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1

  const [{ posts, total, totalPages }, categories, popularTags] = await Promise.all([
    getPublishedPosts({ page: currentPage, limit: 9, search: resolvedSearchParams.search }),
    getBlogCategories(),
    getPopularTags(),
  ])

  return (
    <div className="bg-[var(--black-void)]">
      {/* Hero — warm-tinted, category mockup style */}
      <div className="blog-category-hero">
        <div className="luxury-container relative z-10">
          <h1 className="t-display mb-4">Our Blog</h1>
          <p className="t-body max-w-[600px] mb-6">
            Discover travel tips, luxury transportation insights, and destination guides from VehicleService.
          </p>
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

      {/* Posts Grid — void bg, tighter padding */}
      <section className="bg-[var(--black-void)] py-[clamp(2rem,5vw,3.5rem)]">
        <div className="luxury-container">
          {/* Posts */}
          <div className="mb-12">
            {posts.length > 0 ? (
              currentPage === 1 && !resolvedSearchParams.search ? (
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
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--graphite)] rounded-lg hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all duration-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              ) : (
                <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-muted)]/40 border border-[var(--graphite)]/50 rounded-lg cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </span>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Link
                  key={page}
                  href={`/blog?page=${page}${resolvedSearchParams.search ? `&search=${encodeURIComponent(resolvedSearchParams.search)}` : ''}`}
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
                  href={`/blog?page=${currentPage + 1}${resolvedSearchParams.search ? `&search=${encodeURIComponent(resolvedSearchParams.search)}` : ''}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--graphite)] rounded-lg hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all duration-300"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-muted)]/40 border border-[var(--graphite)]/50 rounded-lg cursor-not-allowed">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </nav>
          )}
        </div>
      </section>

      {/* Popular Tags -- ground */}
      {popularTags.length > 0 && (
        <section className="editorial-section editorial-section--ground bg-[var(--black-void)]" aria-label="Popular topics">
          <div className="luxury-container">
            <BlogMotionSection className="flex items-center gap-3 mb-8">
              <span className="w-6 h-px bg-[var(--gold)]" />
              <h2 className="t-label-accent">Popular Topics</h2>
            </BlogMotionSection>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog/tag/${tag.slug}`}
                  className="px-5 py-2.5 min-h-[44px] flex items-center text-sm text-[var(--text-secondary)] border border-[var(--graphite)] rounded-lg hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all duration-300"
                >
                  {tag.name}
                  <span className="ml-1 text-[var(--text-muted)]">({tag.count})</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <BlogNewsletterCta />
    </div>
  )
}
