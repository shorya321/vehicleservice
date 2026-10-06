import { Metadata } from "next"
import Link from "next/link"

export const dynamic = 'force-dynamic'
import { getPublishedPosts, getBlogCategories, getPopularTags, getFeaturedPosts } from "@/lib/blog/queries"
import { BoardHero } from "./components/board-hero"
import { BoardLatest } from "./components/board-latest"
import { BoardRail } from "./components/board-rail"
import { BoardClose } from "./components/board-close"
import { BlogMotionSection } from "./components/blog-motion-wrapper"
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
  const searchTerm = resolvedSearchParams.search

  return (
    <div className="bg-[var(--black-void)]">
      <a href="#blog-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--gold)] focus:text-[var(--onyx)] focus:rounded-[4px] focus:text-sm focus:font-medium">
        Skip to articles
      </a>

      {/* Hero: headline, search and figures; the featured post sits on the right */}
      <BoardHero
        total={total}
        topicCount={categories.length}
        featured={featuredPost}
        initialSearch={resolvedSearchParams.search}
      />

      {/* Latest: heading + category control, then the bento grid */}
      <BoardLatest
        eyebrow={searchTerm ? 'Search' : 'Latest'}
        heading={searchTerm ? `Results for "${searchTerm}"` : 'Fresh from the desk.'}
        note={searchTerm && (
          <p className="blog-board-lede numeric mt-4">
            {total} {total === 1 ? 'article' : 'articles'} found.{' '}
            <Link href="/blog" className="text-[var(--gold-text)] underline-offset-4 hover:underline">
              Clear search
            </Link>
          </p>
        )}
        categories={categories}
        posts={gridPosts}
        empty={featuredPost ? null : (
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
      >
          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
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
      </BoardLatest>

      {/* Where to next: one card per category */}
      <div className="blog-board-scope">
        <BoardRail categories={categories} />
      </div>

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

      {/* Closing: from reading to booking */}
      <div className="blog-board-scope">
        <BoardClose />
      </div>
    </div>
  )
}
