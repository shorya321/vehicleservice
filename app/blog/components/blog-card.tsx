import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"
import type { PublicBlogPost } from "@/lib/blog/queries"

interface BlogCardProps {
  post: PublicBlogPost
  featured?: boolean
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group block luxury-card luxury-card-hover rounded-2xl overflow-hidden ${featured ? 'md:col-span-2 lg:col-span-1' : ''}`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${featured ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}>
        {post.featured_image_url ? (
          <Image
            src={post.featured_image_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--charcoal)] to-[var(--charcoal-light)] flex items-center justify-center">
            <span className="text-[var(--gold)]/30 text-6xl font-serif">B</span>
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--black-void)] via-transparent to-transparent opacity-60" />

        {/* Category badge */}
        {post.category && (
          <div className="absolute top-4 left-4">
            <span className="inline-block px-3 py-1 text-xs font-medium tracking-wider uppercase bg-[var(--gold)]/90 text-[var(--black-void)] rounded-full backdrop-blur-sm">
              {post.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-3">
        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span>{formatDate(post.published_at)}</span>
          {post.reading_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.reading_time_minutes} min read
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={`font-serif leading-tight text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors duration-300 ${featured ? 'text-2xl' : 'text-xl'}`}>
          {post.title}
        </h3>

        {/* Excerpt — falls back to truncated content */}
        {(post.excerpt || post.content) && (
          <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {post.excerpt || post.content}
          </p>
        )}
      </div>
    </Link>
  )
}
