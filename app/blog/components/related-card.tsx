import Link from "next/link"
import Image from "next/image"
import type { PublicBlogPost } from "@/lib/blog/queries"

interface RelatedCardProps {
  post: PublicBlogPost
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function RelatedCard({ post }: RelatedCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-[var(--charcoal)] border border-[var(--gold)]/[0.08] rounded-2xl overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[var(--gold)]/25 hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="aspect-[16/9] overflow-hidden">
        {post.featured_image_url ? (
          <Image
            src={post.featured_image_url}
            alt={post.title}
            width={600}
            height={338}
            className="w-full h-full object-cover transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--charcoal)] to-[var(--charcoal-light)] flex items-center justify-center">
            <span className="text-[var(--gold)]/30 text-5xl font-serif">B</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        {post.category && (
          <div className="text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-[var(--gold)] mb-2">
            {post.category.name}
          </div>
        )}
        <div className="font-serif text-[1.125rem] leading-[1.3] text-[var(--text-primary)] mb-2">
          {post.title}
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          {formatDate(post.published_at)}
        </div>
      </div>
    </Link>
  )
}
