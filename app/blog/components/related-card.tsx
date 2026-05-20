import Link from "next/link"
import Image from "next/image"
import type { PublicBlogPost } from "@/lib/blog/queries"
import { formatDateShort } from "../utils"

interface RelatedCardProps {
  post: PublicBlogPost
}

export function RelatedCard({ post }: RelatedCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block blog-card-surface rounded-lg overflow-hidden"
    >
      {/* Image */}
      <div className="aspect-[16/9] overflow-hidden">
        {post.featured_image_url ? (
          <Image
            src={post.featured_image_url}
            alt={post.title}
            width={600}
            height={338}
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-[var(--charcoal-light)] flex items-center justify-center">
            <span className="text-[var(--gold)]/30 text-5xl font-sans font-medium">B</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        {post.category && (
          <div className="t-label-accent mb-2">
            {post.category.name}
          </div>
        )}
        <div className="t-subhead mb-2">
          {post.title}
        </div>
        <div className="t-meta">
          {formatDateShort(post.published_at)}
        </div>
      </div>
    </Link>
  )
}
