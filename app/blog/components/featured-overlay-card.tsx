import Link from "next/link"
import Image from "next/image"
import type { PublicBlogPost } from "@/lib/blog/queries"

interface FeaturedOverlayCardProps {
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

export function FeaturedOverlayCard({ post }: FeaturedOverlayCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="group blog-overlay-card focus-visible:ring-2 focus-visible:ring-[var(--gold)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]">
      {/* Image */}
      {post.featured_image_url ? (
        <Image
          src={post.featured_image_url}
          alt={post.title}
          fill
          className="blog-overlay-card__image"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <div className="absolute inset-0 bg-[var(--charcoal)] flex items-center justify-center">
          <span className="text-[var(--gold)]/20 text-9xl font-sans font-medium">B</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="blog-overlay-card__gradient" />

      {/* Content */}
      <div className="blog-overlay-card__content">
        {post.category && (
          <span className="t-label inline-block px-3.5 py-1.5 bg-[var(--gold)] text-[var(--onyx)] rounded-[4px] mb-3">
            {post.category.name}
          </span>
        )}

        <h3 className="t-headline text-[var(--text-primary)] mb-1 leading-tight">
          {post.title}
        </h3>

        <div className="t-meta text-[var(--text-muted)]">
          <span>{formatDate(post.published_at)}</span>
          {post.reading_time_minutes && (
            <>
              <span className="mx-1.5 opacity-40">·</span>
              <span>{post.reading_time_minutes} min read</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
