import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"
import type { PublicBlogPost } from "@/lib/blog/queries"

interface BlogFeaturedHeroProps {
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

export function BlogFeaturedHero({ post }: BlogFeaturedHeroProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="group blog-featured-hero">
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
        {post.category && (
          <span className="t-label inline-block px-3.5 py-1.5 bg-[var(--gold)] text-[var(--onyx)] rounded-[4px] mb-4">
            {post.category.name}
          </span>
        )}

        <h2 className="t-display mb-3 max-w-[700px]">{post.title}</h2>

        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
          <span>{formatDate(post.published_at)}</span>
          {post.reading_time_minutes && (
            <>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.reading_time_minutes} min read
              </span>
            </>
          )}
        </div>

        <span className="inline-flex items-center gap-2 text-[var(--gold)] t-label-accent">
          Read Article
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            &rarr;
          </span>
        </span>
      </div>
    </Link>
  )
}
