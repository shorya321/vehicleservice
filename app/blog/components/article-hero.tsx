import Link from "next/link"
import Image from "next/image"
import { Clock, Eye, Calendar } from "lucide-react"
import type { PublicBlogPost } from "@/lib/blog/queries"

interface ArticleHeroProps {
  post: PublicBlogPost
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatViewCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return count.toString()
}

export function ArticleHero({ post }: ArticleHeroProps) {
  return (
    <div className="blog-featured-hero">
      {/* Image */}
      {post.featured_image_url ? (
        <Image
          src={post.featured_image_url}
          alt={post.title}
          fill
          priority
          sizes="100vw"
          className="blog-featured-hero__image"
        />
      ) : (
        <div className="absolute inset-0 bg-[var(--charcoal)] flex items-center justify-center">
          <span className="text-[var(--gold)]/20 text-9xl font-sans font-medium">B</span>
        </div>
      )}

      {/* Overlay */}
      <div className="blog-featured-hero__overlay" />

      {/* Content */}
      <div className="blog-featured-hero__content">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
          <Link href="/" className="hover:text-[var(--gold)] transition-colors duration-200">
            Home
          </Link>
          <span className="text-[var(--gold)] opacity-40">/</span>
          <Link href="/blog" className="hover:text-[var(--gold)] transition-colors duration-200">
            Blog
          </Link>
          {post.category && (
            <>
              <span className="text-[var(--gold)] opacity-40">/</span>
              <span className="text-[var(--text-secondary)]">{post.category.name}</span>
            </>
          )}
        </nav>

        {/* Category badge + reading time + view count */}
        <div className="flex items-center gap-3 mb-4">
          {post.category && (
            <Link
              href={`/blog/category/${post.category.slug}`}
              className="t-label inline-block px-3.5 py-1.5 bg-[var(--gold)] text-[var(--onyx)] rounded-[4px]"
            >
              {post.category.name}
            </Link>
          )}
          {post.reading_time_minutes && (
            <span className="flex items-center gap-1.5 t-meta text-[var(--text-muted)]">
              <Clock className="w-3.5 h-3.5" />
              {post.reading_time_minutes} min read
            </span>
          )}
          {post.view_count != null && post.view_count > 0 && (
            <span className="flex items-center gap-1.5 t-meta text-[var(--text-muted)]">
              <Eye className="w-3.5 h-3.5" />
              {formatViewCount(post.view_count)} views
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="t-display mb-6 max-w-[800px]">{post.title}</h1>

        {/* Author row */}
        <div className="flex items-center gap-3">
          {post.author?.avatar_url ? (
            <Image
              src={post.author.avatar_url}
              alt={post.author.full_name || 'Author'}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border border-[var(--gold)]/15"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[var(--charcoal)] border border-[var(--gold)]/15 flex items-center justify-center">
              <span className="text-[var(--gold)] text-base font-sans font-medium">
                {(post.author?.full_name || 'A').charAt(0)}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="t-body font-medium text-[var(--text-primary)]">
              {post.author?.full_name || 'Editorial Team'}
            </span>
            <span className="t-meta text-[var(--text-muted)] flex items-center gap-1.5">
              <Calendar className="w-[13px] h-[13px]" />
              {formatDate(post.published_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
