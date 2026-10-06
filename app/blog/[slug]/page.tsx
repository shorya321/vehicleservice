import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import DOMPurify from "isomorphic-dompurify"
import { getPublishedPost, getRelatedPosts, incrementViewCount } from "@/lib/blog/queries"
import { ArticleBoardHero } from "../components/article-board-hero"
import { ArticleBoardAuthor } from "../components/article-board-author"
import { BoardRelated } from "../components/board-related"
import { BoardClose } from "../components/board-close"
import { FloatingShare } from "../components/floating-share"
import { ShareButtons } from "../components/share-buttons"
import { ReadingProgressBar } from "../components/reading-progress-bar"
import { ArrowUpRight } from "lucide-react"

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
    // An admin meta title is the full title, used as typed; the post title
    // alone gets the site suffix from the root template.
    title: post.meta_title ? { absolute: post.meta_title } : post.title,
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

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://infiniatransfers.com'}/blog/${post.slug}`

  return (
    <article className="article-page blog-board-scope">
      <ReadingProgressBar />

      {/* Header: breadcrumb, title and byline; featured image framed on the right */}
      <ArticleBoardHero post={post} />

      {/* Share bar pinned to the bottom of the screen below 1024px */}
      <FloatingShare url={shareUrl} title={post.title} />

      {/* Body: article text, with a sticky sidebar (share, tags, author) from 1024px */}
      <div className="article-page__body">
        <div className="luxury-container article-board-body">
          <div className="article-board-body__main">
            {post.content ? (
              <div className="prose-luxury" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
            ) : (
              <div className="prose-luxury">
                <p className="text-[var(--text-muted)]">This article is being prepared.</p>
              </div>
            )}
          </div>

          <aside aria-label="About this article" className="article-board-body__aside">
            <div className="blog-board-bezel">
              <div className="blog-board-core article-board-card">
                <ShareButtons url={shareUrl} title={post.title} />
              </div>
            </div>

            {post.tags.length > 0 && (
              <div className="blog-board-bezel">
                <div className="blog-board-core article-board-card">
                  <p className="blog-board-eyebrow justify-self-start">
                    <i aria-hidden="true" />
                    Tagged
                  </p>
                  <nav aria-label="Article tags" className="blog-board-chips">
                    {post.tags.map((tag) => (
                      <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                        <span className="text-[var(--gold-text)]" aria-hidden="true">#</span>
                        {tag.name}
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            )}

            <ArticleBoardAuthor author={post.author} />

            <div className="blog-board-bezel">
              <div className="blog-board-core article-board-book">
                <span className="blog-board-eyebrow justify-self-start">
                  <i aria-hidden="true" />
                  Fixed price
                </span>
                <h2>Landing soon?</h2>
                <p>Book your transfer now. Flight tracked, free cancellation.</p>
                <Link href="/" className="blog-board-btn">
                  Find your transfer
                  <span className="blog-board-btn__ic" aria-hidden="true">
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Related Articles */}
      <BoardRelated posts={relatedPosts} />

      {/* Closing: from reading to booking */}
      <BoardClose />
    </article>
  )
}
