import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Clock, Eye, Calendar, ChevronLeft, Tag } from "lucide-react"
import { getPublishedPost, getRelatedPosts, getAllPublishedSlugs, incrementViewCount } from "@/lib/blog/queries"
import { BlogCard } from "../components/blog-card"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs()
  return slugs.map((slug) => ({ slug }))
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

function renderContent(content: string) {
  // Simple markdown-to-HTML conversion for common patterns
  return content
    .split('\n\n')
    .map((block, i) => {
      const trimmed = block.trim()
      if (!trimmed) return null

      // Headings
      if (trimmed.startsWith('### ')) {
        return <h3 key={i} className="text-xl font-serif text-[var(--text-primary)] mt-8 mb-4">{trimmed.slice(4)}</h3>
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-serif text-[var(--text-primary)] mt-10 mb-4">{trimmed.slice(3)}</h2>
      }
      if (trimmed.startsWith('# ')) {
        return <h1 key={i} className="text-3xl font-serif text-[var(--text-primary)] mt-12 mb-6">{trimmed.slice(2)}</h1>
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={i} className="border-l-2 border-[var(--gold)] pl-6 my-6 text-[var(--text-secondary)] italic font-serif text-lg">
            {trimmed.slice(2)}
          </blockquote>
        )
      }

      // Unordered list
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split('\n').map(line => line.replace(/^[-*]\s/, ''))
        return (
          <ul key={i} className="list-disc list-inside space-y-2 my-4 text-[var(--text-secondary)]">
            {items.map((item, j) => <li key={j}>{item}</li>)}
          </ul>
        )
      }

      // Regular paragraph
      return (
        <p key={i} className="text-[var(--text-secondary)] leading-relaxed mb-4">
          {trimmed}
        </p>
      )
    })
    .filter(Boolean)
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
      {/* Hero Image */}
      {post.featured_image_url && (
        <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <Image
            src={post.featured_image_url}
            alt={post.title}
            fill
            className="object-cover brightness-[0.4]"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--black-void)] via-transparent to-[var(--black-void)]/50" />
        </section>
      )}

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
                className="px-3 py-1 text-xs font-medium tracking-wider uppercase bg-[var(--gold)] text-[var(--black-void)] rounded-full"
              >
                {post.category.name}
              </Link>
            )}
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/blog/tag/${tag.slug}`}
                className="px-3 py-1 text-xs text-[var(--text-muted)] border border-[var(--gold)]/20 rounded-full hover:border-[var(--gold)]/50 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[var(--text-primary)] leading-tight mb-6">
            {post.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)] mb-8 pb-8 border-b border-[var(--gold)]/10">
            {post.author && (
              <div className="flex items-center gap-2">
                {post.author.avatar_url ? (
                  <Image
                    src={post.author.avatar_url}
                    alt={post.author.full_name || 'Author'}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--gold)]/20 flex items-center justify-center">
                    <span className="text-xs font-medium text-[var(--gold)]">
                      {(post.author.full_name || 'A')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <span>{post.author.full_name || 'Admin'}</span>
              </div>
            )}
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
            {(post.view_count || 0) > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {post.view_count} views
              </span>
            )}
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <div className="mb-8">
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed font-serif italic border-l-2 border-[var(--gold)] pl-6">
                {post.excerpt}
              </p>
            </div>
          )}

          {/* Content */}
          <div className="prose-luxury mb-16">
            {post.content ? renderContent(post.content) : (
              <p className="text-[var(--text-muted)]">No content available.</p>
            )}
          </div>

          {/* Author Card */}
          {post.author && (
            <div className="luxury-card rounded-2xl p-6 mb-16">
              <div className="flex items-center gap-4">
                {post.author.avatar_url ? (
                  <Image
                    src={post.author.avatar_url}
                    alt={post.author.full_name || 'Author'}
                    width={56}
                    height={56}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[var(--gold)]/20 flex items-center justify-center">
                    <span className="text-lg font-medium text-[var(--gold)]">
                      {(post.author.full_name || 'A')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium tracking-[0.15em] uppercase text-[var(--gold)] mb-1">
                    Written by
                  </p>
                  <p className="font-serif text-lg text-[var(--text-primary)]">
                    {post.author.full_name || 'Admin'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="luxury-container section-padding border-t border-[var(--gold)]/10">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-6 h-px bg-[var(--gold)]" />
            <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[var(--gold)]">
              Related Articles
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((relPost) => (
              <BlogCard key={relPost.id} post={relPost} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
