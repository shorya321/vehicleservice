import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"
import type { PublicBlogPost } from "@/lib/blog/queries"
import { formatDate } from "../utils"

interface BlogCardProps {
  post: PublicBlogPost
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      aria-label={post.title}
      className="group block blog-card-surface rounded-lg overflow-hidden"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/10]">
        {post.featured_image_url ? (
          <Image
            src={post.featured_image_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--charcoal-light)] flex items-center justify-center">
            <span className="text-[var(--gold)]/30 text-6xl font-sans font-medium" aria-hidden="true">B</span>
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(var(--onyx-rgb),0.5)] to-transparent" />

        {/* Category badge */}
        {post.category && (
          <div className="absolute top-4 left-4">
            <span className="t-label inline-block px-3.5 py-1.5 bg-[var(--gold)] text-[var(--onyx)] rounded-[4px]">
              {post.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
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
        <h3 className="t-subhead font-medium group-hover:text-[var(--gold-text)] transition-colors duration-300 line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        {(post.excerpt || post.content) && (
          <p className="t-meta line-clamp-2">
            {post.excerpt || post.content}
          </p>
        )}
      </div>
    </Link>
  )
}
