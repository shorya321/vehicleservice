import { Metadata } from "next"
import Link from "next/link"
import { getPublishedPosts, getBlogCategories, getFeaturedPosts, getPopularTags } from "@/lib/blog/queries"
import { BlogHero } from "./components/blog-hero"
import { BlogCard } from "./components/blog-card"
import { CategoryTabs } from "./components/category-tabs"
import { ChevronLeft, ChevronRight } from "lucide-react"

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

  const [{ posts, total, totalPages }, categories, featuredPosts, popularTags] = await Promise.all([
    getPublishedPosts({ page: currentPage, limit: 9, search: resolvedSearchParams.search }),
    getBlogCategories(),
    getFeaturedPosts(),
    getPopularTags(),
  ])

  return (
    <div className="bg-[var(--black-void)] min-h-screen">
      <BlogHero
        title="Our Blog"
        subtitle="Insights, travel guides, and stories from the world of luxury transportation"
      />

      <div className="luxury-container section-padding">
        {/* Featured Posts */}
        {featuredPosts.length > 0 && currentPage === 1 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-6 h-px bg-[var(--gold)]" />
              <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[var(--gold)]">
                Featured
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <BlogCard key={post.id} post={post} featured />
              ))}
            </div>
          </section>
        )}

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
                No blog posts yet. Check back soon!
              </p>
            </div>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-4 pb-8">
            {currentPage > 1 ? (
              <Link
                href={`/blog?page=${currentPage - 1}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-full hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            ) : (
              <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-muted)]/40 border border-[var(--gold)]/10 rounded-full cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </span>
            )}

            <span className="text-sm text-[var(--text-muted)]">
              Page {currentPage} of {totalPages}
            </span>

            {currentPage < totalPages ? (
              <Link
                href={`/blog?page=${currentPage + 1}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-full hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-300"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-muted)]/40 border border-[var(--gold)]/10 rounded-full cursor-not-allowed">
                Next
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </nav>
        )}

        {/* Popular Tags */}
        {popularTags.length > 0 && (
          <section className="py-12 border-t border-[var(--gold)]/10">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-6 h-px bg-[var(--gold)]" />
              <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[var(--gold)]">
                Popular Topics
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog/tag/${tag.slug}`}
                  className="px-4 py-2 text-sm text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-full hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-300"
                >
                  {tag.name}
                  <span className="ml-1 text-[var(--text-muted)]">({tag.count})</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
