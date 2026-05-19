import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getPublishedPosts, getTagBySlug } from "@/lib/blog/queries"
import { BlogHero } from "../../components/blog-hero"
import { BlogCard } from "../../components/blog-card"
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
    title: `${tag.name} | VehicleService Blog`,
    description: `Browse articles tagged with "${tag.name}" on VehicleService Blog`,
  }
}

export default async function BlogTagPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const currentPage = resolvedSearchParams.page ? parseInt(resolvedSearchParams.page) : 1

  const [tag, { posts, totalPages }] = await Promise.all([
    getTagBySlug(slug),
    getPublishedPosts({ page: currentPage, limit: 9, tagSlug: slug }),
  ])

  if (!tag) {
    notFound()
  }

  return (
    <div className="bg-[var(--black-void)]">
      <BlogHero
        title={`#${tag.name}`}
        subtitle={`Articles tagged with "${tag.name}"`}
        eyebrow="Blog Tag"
      />

      {/* Posts — raised */}
      <section className="editorial-section editorial-section--raised bg-[var(--black-rich)] border-t border-[var(--graphite)]">
        <div className="luxury-container">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors duration-300"
            >
              <ChevronLeft className="h-4 w-4" />
              All Posts
            </Link>
          </div>

          {/* Posts Grid */}
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
                <p className="text-[var(--text-muted)] text-lg">
                  No posts with this tag yet.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-4">
              {currentPage > 1 ? (
                <Link
                  href={`/blog/tag/${slug}?page=${currentPage - 1}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-[4px] hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              ) : <span />}
              <span className="t-meta text-[var(--text-muted)]">
                Page <span className="t-numeric">{currentPage}</span> of <span className="t-numeric">{totalPages}</span>
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={`/blog/tag/${slug}?page=${currentPage + 1}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] border border-[var(--gold)]/20 rounded-[4px] hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-300"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : <span />}
            </nav>
          )}
        </div>
      </section>
    </div>
  )
}
