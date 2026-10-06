import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getPublishedPosts, getCategoryBySlug, getBlogCategories, getFeaturedPosts } from "@/lib/blog/queries"
import { BoardHero } from "../../components/board-hero"
import { BoardLatest } from "../../components/board-latest"
import { BoardRail } from "../../components/board-rail"
import { BoardClose } from "../../components/board-close"
import { buildEntityMetadata } from '@/lib/seo/page-metadata'
import { listCanonical } from '@/lib/seo/list-canonical'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ slug }, { page }] = await Promise.all([params, searchParams])
  const category = await getCategoryBySlug(slug)

  if (!category) {
    return { title: "Category Not Found" }
  }

  return buildEntityMetadata({
    path: listCanonical(`/blog/category/${category.slug}`, page),
    title: `${category.name} | Blog`,
    description: category.description || `Browse ${category.name} articles on Infinia Transfers Blog`,
  })
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

  // The hero shows this category's featured post; without one, page 1 promotes its newest post.
  const featuredPost = featuredPosts.find(fp => fp.category?.slug === slug) ?? null
  const heroPost = featuredPost ?? (isFirstPage ? posts[0] ?? null : null)
  const gridPosts = heroPost
    ? posts.filter(p => p.id !== heroPost.id)
    : posts

  return (
    <div className="bg-[var(--black-void)]">
      {/* Hero: breadcrumb, category name and figures; the featured (or newest) post on the right */}
      <BoardHero
        total={total}
        topicCount={categories.length}
        featured={heroPost}
        featuredLabel={featuredPost ? 'Featured' : 'Latest'}
        title={<>{category.name}<span>.</span></>}
        subtitle={category.description || `Every Infinia guide filed under ${category.name}.`}
        eyebrow={
          <nav aria-label="Breadcrumb" className="blog-hero__eyebrow blog-board-eyebrow">
            <i aria-hidden="true" />
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/blog" className="transition-colors duration-300 hover:text-[var(--gold-text)]">Blog</Link>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
                <span aria-current="page" className="text-[var(--text-primary)]">{category.name}</span>
              </li>
            </ol>
          </nav>
        }
      />

      {/* Articles: heading + category control, then the bento grid */}
      <BoardLatest
        eyebrow={`In ${category.name}`}
        heading={`All ${category.name} guides.`}
        note={heroPost && gridPosts.length === 0 && totalPages <= 1 ? (
          <p className="blog-board-lede mt-4">
            That is every article in {category.name} so far. More are on the way.
          </p>
        ) : null}
        categories={categories}
        posts={gridPosts}
        empty={heroPost ? null : (
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
      >
          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
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
      </BoardLatest>

      {/* Other categories */}
      <div className="blog-board-scope">
        <BoardRail categories={categories} excludeSlug={slug} />
      </div>

      {/* Closing: from reading to booking */}
      <div className="blog-board-scope">
        <BoardClose />
      </div>
    </div>
  )
}
