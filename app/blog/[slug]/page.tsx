import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import nextDynamic from "next/dynamic"
import DOMPurify from "isomorphic-dompurify"
import { getPublishedPost, getRelatedPosts, incrementViewCount } from "@/lib/blog/queries"
import { ArticleMasthead } from "../components/article-masthead"
import { FloatingShare } from "../components/floating-share"
import { RelatedGrid } from "../components/related-grid"
import { ShareButtons } from "../components/share-buttons"
import { AuthorSignoff } from "../components/author-signoff"
import { ReadingProgressBar } from "../components/reading-progress-bar"

const BlogMotionSection = nextDynamic(
  () => import("../components/blog-motion-wrapper").then(m => ({ default: m.BlogMotionSection })),
  { ssr: true }
)
const BlogMotionRule = nextDynamic(
  () => import("../components/blog-motion-wrapper").then(m => ({ default: m.BlogMotionRule })),
  { ssr: true }
)

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

  void incrementViewCount(post.id).catch(() => {})

  const relatedPosts = await getRelatedPosts(post.id, post.category?.id || null)

  return (
    <article className="article-page">
      <ReadingProgressBar />

      {/* Typographic Masthead */}
      <ArticleMasthead post={post} />

      {/* Floating Share — desktop sidebar + mobile bottom bar */}
      <FloatingShare
        url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://infiniatransfers.com'}/blog/${post.slug}`}
        title={post.title}
      />

      {/* Article Body */}
      <div className="article-page__body">
        <div className="article-page__body-inner">
          {/* Featured Image — contained within reading column */}
          {post.featured_image_url && (
            <BlogMotionSection className="article-page__featured-image" withScale>
              <div className="article-page__featured-image-inner">
                <Image
                  src={post.featured_image_url}
                  alt={post.title}
                  width={1200}
                  height={675}
                  priority
                  sizes="(max-width: 768px) 100vw, 75ch"
                  className="article-page__featured-img"
                />
              </div>
            </BlogMotionSection>
          )}

          {/* Article Content */}
          {post.content ? (
            <div className="prose-luxury" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
          ) : (
            <div className="prose-luxury">
              <p className="text-[var(--text-muted)]">This article is being prepared.</p>
            </div>
          )}

          {/* Share Buttons */}
          <BlogMotionSection className="article-page__share-row">
            <ShareButtons
              url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://infiniatransfers.com'}/blog/${post.slug}`}
              title={post.title}
            />
          </BlogMotionSection>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="article-page__tags">
              {post.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog/tag/${tag.slug}`}
                  className="article-page__tag"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Author Sign-off */}
      <BlogMotionSection>
        <AuthorSignoff author={post.author} />
      </BlogMotionSection>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="article-page__related" aria-label="Related articles">
          <div className="article-page__related-inner">
            <BlogMotionSection className="article-page__related-header">
              <BlogMotionRule className="article-page__related-rule" />
              <h2 className="article-page__related-title">Continue Reading</h2>
            </BlogMotionSection>
            <RelatedGrid posts={relatedPosts} />
          </div>
        </section>
      )}
    </article>
  )
}
