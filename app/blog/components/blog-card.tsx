import Link from "next/link"
import Image from "next/image"
import { Clock, Eye } from "lucide-react"
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
      className={`group block luxury-card rounded-2xl overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(198,170,136,0.15)] ${featured ? 'md:col-span-2 lg:col-span-1' : ''}`}
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

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Author & Views */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--gold)]/10">
          {post.author && (
            <div className="flex items-center gap-2">
              {post.author.avatar_url ? (
                <Image
                  src={post.author.avatar_url}
                  alt={post.author.full_name || 'Author'}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[var(--gold)]/20 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-[var(--gold)]">
                    {(post.author.full_name || 'A')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs text-[var(--text-muted)]">
                {post.author.full_name || 'Admin'}
              </span>
            </div>
          )}
          {(post.view_count || 0) > 0 && (
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Eye className="h-3 w-3" />
              {post.view_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
