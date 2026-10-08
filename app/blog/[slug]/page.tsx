import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getPublishedPost, getRelatedPosts, incrementViewCount } from "@/lib/blog/queries"
import { ArticleBoardHero } from "../components/article-board-hero"
import { ArticleBoardAuthor } from "../components/article-board-author"
import { BoardRelated } from "../components/board-related"
import { BoardClose } from "../components/board-close"
import { FloatingShare } from "../components/floating-share"
import { ShareButtons } from "../components/share-buttons"
import { ReadingProgressBar } from "../components/reading-progress-bar"
import { ArticleToc, type TocItem } from "../components/article-toc"
import { ArticleSections } from "../components/article-sections"
import { ArticleFaq } from "../components/article-faq"
import { FAQ_ANCHOR, getPostFaqs, getPostSections, withAnchors } from "@/lib/blog/sections"
import { ArrowUpRight } from "lucide-react"
import { buildEntityMetadata } from "@/lib/seo/page-metadata"
import { absoluteUrl } from "@/lib/seo/site-url"
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo/json-ld"
import { JsonLd } from "@/components/seo/json-ld"
import { getSiteSettings } from "@/lib/site-settings/server"

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

  // The SEO tab's seo_meta row wins where set; the post's legacy meta fields
  // sit under it. The shared builder adds the canonical, robots, share image
  // and a title with the brand once.
  const metadata = await buildEntityMetadata({
    path: `/blog/${post.slug}`,
    entity: { type: 'blog_post', id: post.id },
    title: post.title,
    description: post.excerpt || undefined,
    image: post.featured_image_url,
    type: 'article',
    seo: {
      meta_title: post.meta_title ?? '',
      meta_description: post.meta_description ?? '',
      meta_keywords: post.meta_keywords ?? '',
    },
  })

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: 'article',
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      section: post.category?.name,
      tags: post.tags.length > 0 ? post.tags.map((t) => t.name) : undefined,
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

  const [relatedPosts, site] = await Promise.all([
    getRelatedPosts(post.id, post.category?.id || null),
    getSiteSettings(),
  ])
  const postPath = `/blog/${post.slug}`
  const sections = withAnchors(getPostSections(post))
  const faqs = getPostFaqs(post)
  const tocItems: TocItem[] = [
    ...sections.map((s) => ({ id: s.id, label: s.title })),
    ...(faqs.length > 0 ? [{ id: FAQ_ANCHOR, label: 'FAQ' }] : []),
  ]
  const faqJsonLd = faqPageJsonLd(faqs)
  const jsonLd = [
    articleJsonLd({
      title: post.title,
      description: post.meta_description || post.excerpt || '',
      path: postPath,
      image: post.featured_image_url,
      publishedAt: post.published_at,
      modifiedAt: post.updated_at,
      section: post.category?.name,
      keywords: post.tags.map((t) => t.name),
      authorName: post.author?.full_name ?? null,
      publisherName: site.brand_name,
    }),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      ...(post.category ? [{ name: post.category.name, path: `/blog/category/${post.category.slug}` }] : []),
      { name: post.title, path: postPath },
    ]),
    ...(faqJsonLd ? [faqJsonLd] : []),
  ]

  const shareUrl = absoluteUrl(postPath)

  return (
    <article className="article-page blog-board-scope">
      <JsonLd data={jsonLd} />
      <ReadingProgressBar />

      {/* Header: breadcrumb, title and byline; featured image framed on the right */}
      <ArticleBoardHero post={post} />

      {/* Share bar pinned to the bottom of the screen below 1024px */}
      <FloatingShare url={shareUrl} title={post.title} />

      {/* Body: contents list and sidebar cards on the left from 1024px, article text on the right */}
      <div className="article-page__body">
        <div className="luxury-container article-board-body">
          <aside aria-label="About this article" className="article-board-body__aside">
            {tocItems.length > 1 && <ArticleToc items={tocItems} variant="rail" />}

            <div className="blog-board-bezel article-board-share">
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

          <div className="article-board-body__main">
            {tocItems.length > 1 && <ArticleToc items={tocItems} variant="inline" />}
            <ArticleSections sections={sections} />
            <ArticleFaq faqs={faqs} />
          </div>
        </div>
      </div>

      {/* Related Articles */}
      <BoardRelated posts={relatedPosts} />

      {/* Closing: from reading to booking */}
      <BoardClose />
    </article>
  )
}
