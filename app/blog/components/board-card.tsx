import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, Clock } from "lucide-react"
import type { PublicBlogPost } from "@/lib/blog/queries"
import { formatDate } from "../utils"

interface BoardCardProps {
  post: PublicBlogPost
}

/**
 * Double-bezel article card. Always a third of the row on desktop (half on
 * tablet), so listings and "More from the desk" share one card size.
 */
export function BoardCard({ post }: BoardCardProps) {
  const summary = post.excerpt || post.content

  return (
    <Link
      href={`/blog/${post.slug}`}
      aria-label={post.title}
      className="blog-board-bezel blog-board-card md:col-span-6 lg:col-span-4"
    >
      <div className="blog-board-core blog-board-card__core">
        <div className="blog-board-card__ph">
          {post.featured_image_url ? (
            <Image
              src={post.featured_image_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-[var(--charcoal)]" aria-hidden="true" />
          )}
          {post.category && (
            <span className="blog-board-eyebrow blog-board-card__tag">
              <i aria-hidden="true" />
              {post.category.name}
            </span>
          )}
        </div>
        <div className="blog-board-card__txt">
          <div className="blog-board-meta numeric">
            <span>{formatDate(post.published_at)}</span>
            {post.reading_time_minutes && (
              <span>
                <Clock className="h-3 w-3" aria-hidden="true" />
                {post.reading_time_minutes} min read
              </span>
            )}
          </div>
          <h3>{post.title}</h3>
          {summary && <p className="line-clamp-2">{summary}</p>}
          <span className="blog-board-go blog-board-card__go">
            Read article
            <span className="blog-board-go__ic"><ArrowUpRight className="h-[15px] w-[15px]" strokeWidth={1.5} /></span>
          </span>
        </div>
      </div>
    </Link>
  )
}
