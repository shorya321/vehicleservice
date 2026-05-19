import { Metadata } from "next"
import Link from "next/link"

export const dynamic = 'force-dynamic'
import { getPublishedPosts, getBlogCategories, getFeaturedPosts, getPopularTags } from "@/lib/blog/queries"
import { BlogHero } from "./components/blog-hero"
import { BlogCard } from "./components/blog-card"
import { CategoryTabs } from "./components/category-tabs"
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

  const [{ posts, totalPages }, categories, featuredPosts, popularTags] = await Promise.all([
    getPublishedPosts({ page: currentPage, limit: 9, search: resolvedSearchParams.search }),
    getBlogCategories(),
    getFeaturedPosts(),
    getPopularTags(),
  ])

  return (
    <div className="bg-[var(--black-void)]">
      <BlogHero
        title="Our Blog"
        subtitle="Insights, travel guides, and stories from the world of luxury transportation"
        showSearch
        initialSearch={resolvedSearchParams.search || ''}
      />

      {/* Featured Posts — ground */}
      {featuredPosts.length > 0 && currentPage === 1 && (
        <section className="bg-[var(--black-void)]">
          <div className="luxury-container py-10 md:py-16">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-6 h-px bg-[var(--gold)]" />
              <h2 className="t-label-accent">Featured</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.map((post, index) => (
                <BlogCard key={post.id} post={post} featured hero={index === 0} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Posts Grid — raised */}
      <section className="bg-[var(--black-rich)] border-t border-[var(--graphite)]">
        <div className="luxury-container py-10 md:py-16">
          {/* Category Tabs */}
          <div className="mb-8">
            <CategoryTabs categories={categories} />
          </div>

          {/* Posts */}
          <div className="mb-12">
            {posts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-6 rounded-lg bg-[var(--charcoal)] border border-[var(--gold)]/20 flex items-center justify-center">
                  <Search className="w-6 h-6 text-[var(--gold)]/40" />
                </div>
                <h3 className="t-subhead mb-2">
                  {resolvedSearchParams.search ? 'No results found' : 'No articles yet'}
                </h3>
                <p className="t-meta max-w-md mx-auto">
                  {resolvedSearchParams.search
                    ? `We couldn’t find any articles matching “${resolvedSearchParams.search}”. Try a different search term.`
                    : 'Check back soon for new articles and insights.'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-4 pb-4">
              {currentPage > 1 ? (
                <Link
                  href={`/blog?page=${currentPage - 1}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-[4px] hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              ) : (
                <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-muted)]/40 border border-[var(--gold)]/10 rounded-[4px] cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </span>
              )}

              <span className="t-meta text-[var(--text-muted)]">
                Page <span className="t-numeric">{currentPage}</span> of <span className="t-numeric">{totalPages}</span>
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={`/blog?page=${currentPage + 1}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-[4px] hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-300"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-muted)]/40 border border-[var(--gold)]/10 rounded-[4px] cursor-not-allowed">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </nav>
          )}
        </div>
      </section>

      {/* Popular Tags — ground */}
      {popularTags.length > 0 && (
        <section className="bg-[var(--black-void)]" aria-label="Popular topics">
          <div className="luxury-container py-10 md:py-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-6 h-px bg-[var(--gold)]" />
              <h2 className="t-label-accent">Popular Topics</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog/tag/${tag.slug}`}
                  className="px-5 py-2.5 min-h-[44px] flex items-center text-sm text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-[4px] hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-300"
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
