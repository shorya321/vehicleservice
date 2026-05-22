import Link from "next/link"
import Image from "next/image"
import type { PublicBlogPost } from "@/lib/blog/queries"
import { formatDateShort } from "../utils"
import { BlogMotionCard } from "./blog-motion-wrapper"

interface RelatedGridProps {
  posts: PublicBlogPost[]
}

export function RelatedGrid({ posts }: RelatedGridProps) {
  return (
    <div className="article-related-grid">
      {posts.slice(0, 3).map((post, i) => (
        <BlogMotionCard key={post.id} index={i}>
          <Link
            href={`/blog/${post.slug}`}
            className="group block article-related-grid__card"
          >
            <div className="article-related-grid__image">
              {post.featured_image_url ? (
                <Image
                  src={post.featured_image_url}
                  alt={post.title}
                  width={600}
                  height={338}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full bg-[var(--charcoal)] flex items-center justify-center">
                  <span className="text-[var(--gold)]/20 text-4xl font-medium" aria-hidden="true">B</span>
                </div>
              )}
            </div>
            <div className="article-related-grid__body">
              {post.category && (
                <span className="article-related-grid__category">
                  {post.category.name}
                </span>
              )}
              <h3 className="article-related-grid__title">
                {post.title}
              </h3>
              <span className="article-related-grid__date">
                {formatDateShort(post.published_at)}
              </span>
            </div>
          </Link>
        </BlogMotionCard>
      ))}
    </div>
  )
}
