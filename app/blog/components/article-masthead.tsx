import Link from "next/link"
import Image from "next/image"
import { Clock, Eye } from "lucide-react"
import type { PublicBlogPost } from "@/lib/blog/queries"
import { formatDate } from "../utils"

interface ArticleMastheadProps {
  post: PublicBlogPost
}

function formatViewCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return count.toString()
}

export function ArticleMasthead({ post }: ArticleMastheadProps) {
  return (
    <header className="article-masthead">
      <div className="article-masthead__inner">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="article-masthead__breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <li>
              <Link href="/" className="hover:text-[var(--gold-text)] transition-colors duration-200">Home</Link>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[var(--gold)] opacity-40" aria-hidden="true">/</span>
              <Link href="/blog" className="hover:text-[var(--gold-text)] transition-colors duration-200">Blog</Link>
            </li>
            {post.category && (
              <li className="flex items-center gap-2">
                <span className="text-[var(--gold)] opacity-40" aria-hidden="true">/</span>
                <Link
                  href={`/blog/category/${post.category.slug}`}
                  className="text-[var(--text-secondary)] hover:text-[var(--gold-text)] transition-colors duration-200"
                >
                  {post.category.name}
                </Link>
              </li>
            )}
          </ol>
        </nav>

        {/* Category chip */}
        {post.category && (
          <Link
            href={`/blog/category/${post.category.slug}`}
            className="article-masthead__category"
          >
            {post.category.name}
          </Link>
        )}

        {/* Title */}
        <h1 className="article-masthead__title">{post.title}</h1>

        {/* Excerpt as subtitle */}
        {post.excerpt && (
          <p className="article-masthead__subtitle">{post.excerpt}</p>
        )}

        {/* Meta line: author + date + reading time + views */}
        <div className="article-masthead__meta">
          {post.author?.avatar_url ? (
            <Image
              src={post.author.avatar_url}
              alt={post.author.full_name || 'Author'}
              width={36}
              height={36}
              sizes="36px"
              className="w-9 h-9 rounded-full object-cover border border-[var(--gold)]/10"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[var(--charcoal)] border border-[var(--gold)]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[var(--gold)] text-sm font-medium">
                {(post.author?.full_name || 'A').charAt(0)}
              </span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-medium text-[var(--text-primary)]">
              {post.author?.full_name || 'Editorial Team'}
            </span>
            <span className="text-[var(--text-muted)]" aria-hidden="true">&middot;</span>
            <time className="text-[var(--text-muted)]" dateTime={post.published_at || undefined}>
              {formatDate(post.published_at)}
            </time>
            {post.reading_time_minutes && (
              <>
                <span className="text-[var(--text-muted)]" aria-hidden="true">&middot;</span>
                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  {post.reading_time_minutes} min read
                </span>
              </>
            )}
            {post.view_count != null && post.view_count > 0 && (
              <>
                <span className="text-[var(--text-muted)]" aria-hidden="true">&middot;</span>
                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  {formatViewCount(post.view_count)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
