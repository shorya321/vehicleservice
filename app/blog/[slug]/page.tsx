import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Clock, Calendar, ChevronLeft } from "lucide-react"
import { getPublishedPost, getRelatedPosts, incrementViewCount } from "@/lib/blog/queries"
import { RelatedCard } from "../components/related-card"

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

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}


export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPublishedPost(slug)

  if (!post) {
    notFound()
  }

  // Increment view count (fire-and-forget)
  incrementViewCount(post.id)

  const relatedPosts = await getRelatedPosts(post.id, post.category?.id || null)

  return (
    <div className="bg-[var(--black-void)] min-h-screen">
      {/* Article */}
      <article className="luxury-container">
        <div className="max-w-[750px] mx-auto">
          {/* Back link */}
          <div className="pt-8 pb-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors duration-300"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </div>

          {/* Category & Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.category && (
              <Link
                href={`/blog/category/${post.category.slug}`}
                className="px-3 py-1 text-[0.6875rem] font-medium tracking-[0.08em] uppercase bg-[var(--gold)] text-[var(--black-void)] rounded-full"
              >
                {post.category.name}
              </Link>
            )}
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/blog/tag/${tag.slug}`}
                className="px-3 py-1 text-[0.6875rem] text-[var(--text-muted)] border border-[var(--gold)]/20 rounded-full hover:border-[var(--gold)]/50 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[var(--text-primary)] leading-[1.15] mb-6">
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)] mb-8 pb-8 border-b border-[var(--gold)]/10">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.published_at)}
            </span>
            {post.reading_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.reading_time_minutes} min read
              </span>
            )}
          </div>

          {/* Featured Image (inline) */}
          {post.featured_image_url && (
            <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-[var(--gold)]/15 mb-10">
              <Image
                src={post.featured_image_url}
                alt={post.title}
                width={750}
                height={422}
                className="w-full h-full object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 750px"
              />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <div className="mb-8">
              <p className="text-lg text-[var(--text-secondary)] leading-[1.7] font-serif italic border-l-2 border-[var(--gold)] pl-6">
                {post.excerpt}
              </p>
            </div>
          )}

          {/* Content */}
          {post.content ? (
            <div className="prose-luxury mb-16" dangerouslySetInnerHTML={{ __html: post.content }} />
          ) : (
            <div className="prose-luxury mb-16">
              <p className="text-[var(--text-muted)]">No content available.</p>
            </div>
          )}

        </div>
      </article>

      {/* Related Posts */}
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
