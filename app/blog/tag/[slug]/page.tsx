import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'
import { ChevronRight, ArrowRight } from "lucide-react"
import { getPublishedPosts, getTagBySlug, getPopularTags } from "@/lib/blog/queries"
import { BlogCard } from "../../components/blog-card"
import { BlogFeaturedSpread } from "../../components/blog-featured-spread"
import { TagCloud } from "../../components/tag-cloud"
import { BlogMotionCard, BlogMotionSection } from "../../components/blog-motion-wrapper"

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
  const parsedPage = parseInt(resolvedSearchParams.page ?? '', 10)
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const isFirstPage = currentPage === 1

  const [tag, { posts, total, totalPages }, popularTags] = await Promise.all([
    getTagBySlug(slug),
    getPublishedPosts({ page: currentPage, limit: 9, tagSlug: slug }),
    getPopularTags(),
  ])

  if (!tag) {
    notFound()
  }

  const featuredPost = isFirstPage && posts.length > 0 ? posts[0] : null
  const gridPosts = featuredPost
    ? posts.filter(p => p.id !== featuredPost.id)
    : posts

  return (
    <div className="bg-[var(--black-void)]">
      {/* Tag Hero */}
      <div className="blog-tag-hero blog-hero-animate">
        <div className="luxury-container relative z-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="blog-hero__eyebrow mb-6">
            <ol className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <li>
                <Link href="/blog" className="hover:text-[var(--gold-text)] transition-colors duration-300">Blog</Link>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span aria-current="page" className="text-[var(--text-secondary)]">{tag.name}</span>
              </li>
            </ol>
          </nav>

          {/* Tag name with # prefix */}
          <h1 className="blog-hero__title t-display mb-4">
            <span className="text-[var(--gold)]">#</span>{tag.name}
          </h1>

          {/* Post count */}
          <span className="blog-hero__subtitle inline-flex items-center px-3 py-1 t-meta text-[var(--text-muted)] border border-[var(--gold)]/20 rounded-full mb-6">
            {total} {total === 1 ? 'article' : 'articles'}
          </span>

          {/* Decorative hairline */}
          <div className="blog-hero__rule flex justify-center" aria-hidden="true">
            <div className="w-24 h-px bg-[var(--gold)]" />
          </div>
        </div>
      </div>

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
        <section className="bg-[var(--black-void)] py-[clamp(2rem,5vw,3.5rem)]">
          <div className="luxury-container">
            <div className="mb-12">
              {gridPosts.length > 0 ? (
                <>
                  {/* Section label */}
                  <div className="flex items-center gap-3 mb-8">
                    <span className="w-6 h-px bg-[var(--gold)]" aria-hidden="true" />
                    <h2 className="t-label-accent">
                      {featuredPost ? 'More Articles' : 'Articles'}
                    </h2>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gridPosts.map((post, index) => (
                      <BlogMotionCard key={post.id} index={index}>
                        <BlogCard post={post} />
                      </BlogMotionCard>
                    ))}
                  </div>
                </>
              ) : !featuredPost ? (
                <BlogMotionSection>
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
                </BlogMotionSection>
              ) : null}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={`/blog/tag/${slug}?page=${currentPage - 1}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--graphite)] rounded-lg hover:border-[var(--gold)] hover:text-[var(--gold-text)] transition-all duration-300"
                  >
                    Previous
                  </Link>
                ) : (
                  <span aria-disabled="true" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-muted)]/40 border border-[var(--graphite)]/50 rounded-lg cursor-not-allowed">
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
      )}

      {/* Browse more CTA for low-content pages */}
      {posts.length > 0 && posts.length <= 3 && totalPages <= 1 && (
        <div className="bg-[var(--black-void)] text-center pb-[clamp(1.5rem,3vw,2.5rem)]">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors duration-300"
          >
            Browse all articles
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Related Tags */}
      {popularTags.length > 0 && (
        <BlogMotionSection>
          <TagCloud tags={popularTags} currentSlug={slug} />
        </BlogMotionSection>
      )}
    </div>
  )
}
