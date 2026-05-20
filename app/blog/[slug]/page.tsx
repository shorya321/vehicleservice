import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import DOMPurify from "isomorphic-dompurify"
import { getPublishedPost, getRelatedPosts, incrementViewCount } from "@/lib/blog/queries"
import { ArticleHero } from "../components/article-hero"
import { FloatingShare } from "../components/floating-share"
import { RelatedScroll } from "../components/related-scroll"
import { ShareButtons } from "../components/share-buttons"
import { BlogMotionSection } from "../components/blog-motion-wrapper"

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
    title: `${title} | Infinia Transfers Blog`,
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

  incrementViewCount(post.id)

  const relatedPosts = await getRelatedPosts(post.id, post.category?.id || null)

  return (
    <div className="bg-[var(--black-void)]">
      {/* Article Hero — full-bleed image with overlaid text */}
      <ArticleHero post={post} />

      {/* Floating Share — desktop sidebar + mobile bottom bar */}
      <FloatingShare
        url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://infiniatransfers.com'}/blog/${post.slug}`}
        title={post.title}
      />

      {/* Article Content — reading column with distinct background */}
      <div className="blog-reading-column">
        <div className="blog-reading-column__inner">
          {/* Pull Quote / Excerpt */}
          {post.excerpt && (
            <BlogMotionSection>
              <div className="blog-pull-quote mb-8">
                <p className="font-body text-xl italic leading-[1.6] text-[var(--text-primary)]">
                  {post.excerpt}
                </p>
              </div>
            </BlogMotionSection>
          )}

          {/* Article Content */}
          {post.content ? (
            <div className="prose-luxury mb-8" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
          ) : (
            <div className="prose-luxury mb-8">
              <p className="text-[var(--text-muted)]">No content available.</p>
            </div>
          )}

          {/* Share Buttons (inline fallback) */}
          <div className="mb-8 pb-8 border-b border-[var(--graphite)]">
            <ShareButtons
              url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://infiniatransfers.com'}/blog/${post.slug}`}
              title={post.title}
            />
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog/tag/${tag.slug}`}
                  className="inline-flex items-center min-h-[44px] px-3.5 py-1.5 text-sm font-medium tracking-[0.05em] text-[var(--text-muted)] border border-[var(--graphite)] rounded-[4px] hover:text-[var(--gold-text)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 transition-all duration-200"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Divider */}
          <BlogMotionSection>
            <div className="blog-diamond-divider" />
          </BlogMotionSection>

          {/* Author Bio Card */}
          <BlogMotionSection>
          <div className="author-bio-card">
            <div className="flex gap-6 items-start max-sm:flex-col max-sm:items-center max-sm:text-center">
              {post.author?.avatar_url ? (
                <Image
                  src={post.author.avatar_url}
                  alt={post.author.full_name || 'Author'}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover border border-[var(--gold)]/15 flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[var(--charcoal-light)] border border-[var(--gold)]/15 flex-shrink-0 flex items-center justify-center">
                  <span className="text-[var(--gold)] text-2xl font-sans font-medium">
                    {(post.author?.full_name || 'A').charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="t-label-accent mb-1">Written by</div>
                <h3 className="t-subhead">{post.author?.full_name || 'Editorial Team'}</h3>
              </div>
            </div>
          </div>
          </BlogMotionSection>
        </div>
      </div>

      {/* Related Posts — horizontal scroll */}
      {relatedPosts.length > 0 && (
        <section className="editorial-section editorial-section--raised bg-[var(--black-rich)] border-t border-[var(--graphite)]">
          <div className="luxury-container">
            <BlogMotionSection className="flex items-center gap-3 mb-8">
              <span className="w-6 h-px bg-[var(--gold)]" />
              <h2 className="t-label-accent">Related Articles</h2>
            </BlogMotionSection>
            <RelatedScroll posts={relatedPosts} />
          </div>
        </section>
      )}

    </div>
  )
}
