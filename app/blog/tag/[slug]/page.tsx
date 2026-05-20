import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getPublishedPosts, getTagBySlug, getPopularTags } from "@/lib/blog/queries"
import { BlogCard } from "../../components/blog-card"
import { TagCloud } from "../../components/tag-cloud"
import { BlogMotionCard } from "../../components/blog-motion-wrapper"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tag = await getTagBySlug(slug)

  if (!tag) {
    return { title: "Tag Not Found" }
  }

  return {
    title: `${tag.name} | Infinia Transfers Blog`,
    description: `Browse articles tagged with "${tag.name}" on Infinia Transfers Blog`,
  }
}

export default async function BlogTagPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const currentPage = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1

  const [tag, { posts, total, totalPages }, popularTags] = await Promise.all([
    getTagBySlug(slug),
    getPublishedPosts({ page: currentPage, limit: 9, tagSlug: slug }),
    getPopularTags(),
  ])

  if (!tag) {
    notFound()
  }

  return (
    <div className="bg-[var(--black-void)]">
      {/* Tag Hero — compact */}
      <div className="blog-tag-hero blog-hero-animate">
        <div className="luxury-container">
          {/* Breadcrumb */}
          <Link
            href="/blog"
            className="blog-hero__eyebrow inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--gold-text)] transition-colors duration-300 mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Tag name with # prefix */}
          <h1 className="blog-hero__title t-display mb-3">
            <span className="text-[var(--gold)]">#</span>{tag.name}
          </h1>

          {/* Post count */}
          <span className="blog-hero__subtitle inline-flex items-center px-3 py-1 t-meta text-[var(--text-muted)] border border-[var(--gold)]/20 rounded-full mb-6">
            {total} {total === 1 ? 'article' : 'articles'}
          </span>

          {/* Decorative hairline */}
          <div className="blog-hero__rule flex justify-center" aria-hidden="true">
            <div className="w-16 h-px bg-[var(--gold)]" />
          </div>
        </div>
      </div>

      {/* Posts — raised */}
      <section className="editorial-section editorial-section--raised bg-[var(--black-rich)] border-t border-[var(--graphite)]">
        <div className="luxury-container">
          {/* Posts Grid — standard 3-col (no magazine for tags) */}
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
                  <span className="text-[var(--gold)]/40 text-2xl font-sans font-medium">#</span>
                </div>
                <h2 className="t-subhead mb-2">No articles with this tag</h2>
                <p className="t-meta max-w-md mx-auto mb-6">
                  We haven&apos;t published any articles tagged &ldquo;{tag.name}&rdquo; yet. Browse other tags or check back soon.
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
                  href={`/blog/tag/${slug}?page=${currentPage - 1}`}
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
                  href={`/blog/tag/${slug}?page=${page}`}
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
                  href={`/blog/tag/${slug}?page=${currentPage + 1}`}
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

      {/* Related Tags */}
      {popularTags.length > 0 && (
        <TagCloud tags={popularTags} currentSlug={slug} />
      )}
    </div>
  )
}
