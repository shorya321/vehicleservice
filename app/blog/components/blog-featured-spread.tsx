import Link from "next/link"
import Image from "next/image"
import { Clock, ArrowRight } from "lucide-react"
import type { PublicBlogPost } from "@/lib/blog/queries"
import { formatDate } from "../utils"

interface FeaturedSpreadProps {
  post: PublicBlogPost
}

export function BlogFeaturedSpread({ post }: FeaturedSpreadProps) {
  return (
    <article className="blog-featured-spread">
      <Link href={`/blog/${post.slug}`} aria-label={post.title} className="group block">
        <div className="grid lg:grid-cols-[3fr_2fr]">
          {/* Image */}
          <div className="blog-featured-spread__image relative overflow-hidden">
            {post.featured_image_url ? (
              <Image
                src={post.featured_image_url}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-[var(--charcoal)] flex items-center justify-center">
                <span className="text-[var(--gold)]/20 text-8xl font-sans font-semibold select-none" aria-hidden="true">B</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="blog-featured-spread__content flex flex-col justify-center">
            {post.category && (
              <span className="t-label-accent mb-5">{post.category.name}</span>
            )}

            <h2 className="t-headline font-semibold text-[var(--text-primary)] group-hover:text-[var(--gold-text)] transition-colors duration-300 mb-4 text-balance line-clamp-3">
              {post.title}
            </h2>

            {(post.excerpt || post.content) && (
              <p className="t-body text-[var(--text-secondary)] line-clamp-3 max-w-[50ch] mb-6">
                {post.excerpt || post.content}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <span>{formatDate(post.published_at)}</span>
                {post.reading_time_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.reading_time_minutes} min read
                  </span>
                )}
              </div>

              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--gold-text)] transition-opacity duration-300">
                Read
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}
