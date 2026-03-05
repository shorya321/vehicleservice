import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"
import type { PublicBlogPost } from "@/lib/blog/queries"

interface BlogCardProps {
  post: PublicBlogPost
  featured?: boolean
  /** Render as a wide horizontal card (first featured post) */
  hero?: boolean
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function BlogCard({ post, featured = false, hero = false }: BlogCardProps) {
  if (hero) {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group block luxury-card luxury-card-hover rounded-2xl overflow-hidden md:col-span-2 lg:col-span-3"
      >
        <div className="grid md:grid-cols-2">
          {/* Image — left half */}
          <div className="relative overflow-hidden aspect-[16/10] md:aspect-auto md:min-h-[320px]">
            {post.featured_image_url ? (
              <Image
                src={post.featured_image_url}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--charcoal)] to-[var(--charcoal-light)] flex items-center justify-center">
                <span className="text-[var(--gold)]/30 text-7xl font-serif">B</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--black-void)] via-transparent to-transparent opacity-40 md:bg-gradient-to-r" />
            {post.category && (
              <div className="absolute top-4 left-4">
                <span className="inline-block px-3.5 py-1.5 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase bg-[var(--gold)] text-[var(--black-void)] rounded-full shadow-md">
                  {post.category.name}
                </span>
              </div>
            )}
          </div>

          {/* Content — right half */}
          <div className="p-8 md:p-10 flex flex-col justify-center space-y-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-5 h-px bg-[var(--gold)]" />
              <span className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-[var(--gold)]">
                Featured
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span>{formatDate(post.published_at)}</span>
              {post.reading_time_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.reading_time_minutes} min read
                </span>
              )}
            </div>
            <h3 className="font-serif text-2xl md:text-3xl leading-tight text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors duration-300">
              {post.title}
            </h3>
            {(post.excerpt || post.content) && (
              <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                {post.excerpt || post.content}
              </p>
            )}
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--gold)] mt-2">
              Read Article
              <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block luxury-card luxury-card-hover rounded-2xl overflow-hidden"
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
            <span className="inline-block px-3.5 py-1.5 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase bg-[var(--gold)] text-[var(--black-void)] rounded-full shadow-md">
              {post.category.name}
            </span>
          </div>
        )}

        {/* Featured badge */}
        {featured && (
          <div className="absolute top-4 right-4">
            <span className="inline-block px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.1em] uppercase bg-[var(--black-void)]/70 text-[var(--gold)] border border-[var(--gold)]/30 rounded-full backdrop-blur-sm">
              Featured
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
