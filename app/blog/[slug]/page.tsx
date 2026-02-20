import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getPublishedPost, getRelatedPosts, getPublishedPosts, getBlogCategories, getPopularTags, incrementViewCount } from "@/lib/blog/queries"
import { RelatedCard } from "../components/related-card"
import { BlogArticleHeader } from "../components/blog-article-header"
import { BlogSidebar } from "../components/blog-sidebar"

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPost(slug)

  if (!post) {
    return { title: "Post Not Found" }
  }

  const title = post.meta_title || post.title
  const description = post.meta_description || post.excerpt || ''

  return {
    title: `${title} | VehicleService Blog`,
    description,
    keywords: post.meta_keywords || undefined,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.published_at || undefined,
      images: post.featured_image_url ? [{ url: post.featured_image_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.featured_image_url ? [post.featured_image_url] : [],
    },
  }
}


export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPublishedPost(slug)

  if (!post) {
    notFound()
  }

  // Increment view count (fire-and-forget)
  incrementViewCount(post.id)

  // Parallel data fetching for sidebar + related posts
  const [relatedPosts, categories, recentData, popularTags] = await Promise.all([
    getRelatedPosts(post.id, post.category?.id || null),
    getBlogCategories(),
    getPublishedPosts({ limit: 5 }),
    getPopularTags(),
  ])

  const recentPosts = recentData.posts.filter(p => p.id !== post.id).slice(0, 4)

  return (
    <div className="bg-[var(--black-void)] min-h-screen">
      {/* Article Header — Full-width above grid */}
      <div className="luxury-container">
        <BlogArticleHeader post={post} />
      </div>

      {/* Two-column grid — content + sidebar */}
      <div className="luxury-container">
        <div className="blog-article-layout">
          {/* Main Content */}
          <main>
            {/* Pullquote / Excerpt */}
            {post.excerpt && (
              <div className="border-l-2 border-[var(--gold)] pl-6 mb-8">
                <p className="font-serif text-xl italic leading-[1.7] text-[var(--text-secondary)]">
                  {post.excerpt}
                </p>
              </div>
            )}

            {/* Article Content */}
            {post.content ? (
              <div className="prose-luxury mb-8" dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : (
              <div className="prose-luxury mb-8">
                <p className="text-[var(--text-muted)]">No content available.</p>
              </div>
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="blog-tags-section">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/blog/tag/${tag.slug}`}
                    className="inline-block px-3.5 py-1.5 text-xs font-medium tracking-[0.05em] text-[var(--text-muted)] border border-[var(--gold)]/20 rounded-full hover:text-[var(--gold)] hover:border-[var(--gold)]/50 hover:bg-[var(--gold)]/5 transition-all duration-200"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Diamond Divider */}
            <div className="blog-diamond-divider">
              <div className="blog-diamond-icon" />
            </div>

            {/* Author Bio Card */}
            <div className="author-bio-card">
              <div className="flex gap-6 items-start max-sm:flex-col max-sm:items-center max-sm:text-center">
                {post.author?.avatar_url ? (
                  <Image
                    src={post.author.avatar_url}
                    alt={post.author.full_name || 'Author'}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover border-2 border-[var(--gold)]/25 flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[var(--charcoal)] border-2 border-[var(--gold)]/25 flex-shrink-0 flex items-center justify-center">
                    <span className="text-[var(--gold)] text-2xl font-serif">
                      {(post.author?.full_name || 'A').charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-[0.6875rem] font-semibold tracking-[0.15em] uppercase text-[var(--gold)] mb-1">
                    Written by
                  </div>
                  <h3 className="font-serif text-2xl font-normal text-[var(--text-primary)] mb-1">
                    {post.author?.full_name || 'Editorial Team'}
                  </h3>
                  <div className="text-[0.8125rem] text-[var(--text-muted)] mb-3">
                    Senior Travel Editor
                  </div>
                  <p className="text-[0.9375rem] text-[var(--text-secondary)] leading-[1.7]">
                    Bringing you the finest insights on luxury travel, premium transfers, and the art of seamless journeys across the Middle East.
                  </p>
                </div>
              </div>
            </div>
          </main>

          {/* Sidebar */}
          <aside>
            <BlogSidebar
              categories={categories}
              recentPosts={recentPosts}
              popularTags={popularTags}
            />
          </aside>
        </div>
      </div>

      {/* Related Posts — Full Width */}
      {relatedPosts.length > 0 && (
        <section className="luxury-container pt-10 pb-16 border-t border-[var(--gold)]/10">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-6 h-px bg-[var(--gold)]" />
            <h2 className="text-[0.8125rem] font-medium tracking-[0.15em] uppercase text-[var(--gold)]">
              Related Articles
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((relPost) => (
              <RelatedCard key={relPost.id} post={relPost} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
