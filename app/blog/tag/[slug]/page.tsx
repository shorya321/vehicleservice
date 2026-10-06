import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'
import { ChevronRight, ArrowRight } from "lucide-react"
import { getPublishedPosts, getTagBySlug, getPopularTags, getBlogCategories } from "@/lib/blog/queries"
import { BoardHero } from "../../components/board-hero"
import { BoardLatest } from "../../components/board-latest"
import { BoardTags } from "../../components/board-tags"
import { BoardRail } from "../../components/board-rail"
import { BoardClose } from "../../components/board-close"

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

  const [tag, { posts, total, totalPages }, popularTags, categories] = await Promise.all([
    getTagBySlug(slug),
    getPublishedPosts({ page: currentPage, limit: 9, tagSlug: slug }),
    getPopularTags(),
    getBlogCategories(),
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
      {/* Hero: breadcrumb, #tag and figures; the newest tagged post on the right (page 1) */}
      <BoardHero
        total={total}
        topicCount={categories.length}
        featured={featuredPost}
        featuredLabel="Latest"
        title={<><span>#</span>{tag.name}</>}
        subtitle={`Every Infinia article tagged ${tag.name}, newest first.`}
        eyebrow={
          <nav aria-label="Breadcrumb" className="blog-hero__eyebrow blog-board-eyebrow">
            <i aria-hidden="true" />
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/blog" className="transition-colors duration-300 hover:text-[var(--gold-text)]">Blog</Link>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
                <span aria-current="page" className="text-[var(--text-primary)]">#{tag.name}</span>
              </li>
            </ol>
          </nav>
        }
      />

      {/* Articles: heading + category control, then the bento grid */}
      <BoardLatest
        eyebrow="Tagged"
        heading={featuredPost ? `More tagged #${tag.name}.` : `Tagged #${tag.name}.`}
        note={featuredPost && gridPosts.length === 0 && totalPages <= 1 ? (
          <p className="blog-board-lede mt-4">
            That is every article tagged {tag.name} so far.{' '}
            <Link href="/blog" className="inline-flex items-center gap-1 text-[var(--gold-text)] underline-offset-4 hover:underline">
              Browse all articles
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </p>
        ) : null}
        categories={categories}
        posts={gridPosts}
        empty={featuredPost ? null : (
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
      >
            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
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
      </BoardLatest>

      {/* Related tags */}
      <div className="blog-board-scope">
        <BoardTags tags={popularTags} excludeSlug={slug} />
      </div>

      {/* Categories */}
      <div className="blog-board-scope">
        <BoardRail categories={categories} />
      </div>

      {/* Closing: from reading to booking */}
      <div className="blog-board-scope">
        <BoardClose />
      </div>
    </div>
  )
}
