import Link from "next/link"
import Image from "next/image"
import { Clock, Calendar } from "lucide-react"
import type { PublicBlogPost } from "@/lib/blog/queries"

interface BlogArticleHeaderProps {
  post: PublicBlogPost
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function BlogArticleHeader({ post }: BlogArticleHeaderProps) {
  return (
    <div className="blog-article-header">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
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

      {/* Category badge + reading time */}
      <div className="flex items-center gap-3 mb-5">
        {post.category && (
          <Link
            href={`/blog/category/${post.category.slug}`}
            className="inline-block px-3.5 py-1 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase bg-[var(--gold)] text-[var(--black-void)] rounded-full"
          >
            {post.category.name}
          </Link>
        )}
        {post.reading_time_minutes && (
          <span className="flex items-center gap-1.5 text-[0.8125rem] text-[var(--text-muted)]">
            <Clock className="w-3.5 h-3.5" />
            {post.reading_time_minutes} min read
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[1.1] tracking-[-0.02em] text-[var(--text-primary)] mb-8">
        {post.title}
      </h1>

      {/* Author row */}
      <div className="flex items-center gap-4 py-5 border-t border-b border-[var(--gold)]/[0.12] mb-8">
        {post.author?.avatar_url ? (
          <Image
            src={post.author.avatar_url}
            alt={post.author.full_name || 'Author'}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover border-2 border-[var(--gold)]/20"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[var(--charcoal)] border-2 border-[var(--gold)]/20 flex items-center justify-center">
            <span className="text-[var(--gold)] text-lg font-serif">
              {(post.author?.full_name || 'A').charAt(0)}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-[0.9375rem] font-medium text-[var(--text-primary)]">
            {post.author?.full_name || 'Editorial Team'}
          </span>
          <span className="text-[0.8125rem] text-[var(--text-muted)] flex items-center gap-1.5">
            <Calendar className="w-[13px] h-[13px]" />
            {formatDate(post.published_at)}
          </span>
        </div>
      </div>

      {/* Featured image */}
      {post.featured_image_url && (
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-[var(--gold)]/[0.15] group">
          <Image
            src={post.featured_image_url}
            alt={post.title}
            width={900}
            height={506}
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            priority
            sizes="(max-width: 768px) 100vw, 900px"
          />
        </div>
      )}
    </div>
  )
}
