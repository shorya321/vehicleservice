import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Clock, Eye } from "lucide-react"
import type { PublicBlogPost } from "@/lib/blog/queries"
import { formatDate } from "../utils"

interface ArticleBoardHeroProps {
  post: PublicBlogPost
}

function formatViewCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return count.toString()
}

/**
 * Article header in the /blog board style: breadcrumb, title and byline
 * on the left; the featured image framed on the right with a reading-time card.
 * Without an image the header is a single column.
 */
export function ArticleBoardHero({ post }: ArticleBoardHeroProps) {
  const author = post.author?.full_name || 'Editorial Team'
  const image = post.featured_image_url

  return (
    <header className="blog-board-hero">
      <div className={`luxury-container blog-board-hero__grid blog-board-hero__grid--article${image ? '' : ' blog-board-hero__grid--single'}`}>
        <div className="blog-hero-animate">
          <nav aria-label="Breadcrumb" className="blog-hero__eyebrow blog-board-eyebrow">
            <i aria-hidden="true" />
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/blog" className="transition-colors duration-300 hover:text-[var(--gold-text)]">Blog</Link>
              </li>
              {post.category && (
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                  <Link
                    href={`/blog/category/${post.category.slug}`}
                    className="text-[var(--text-primary)] transition-colors duration-300 hover:text-[var(--gold-text)]"
                  >
                    {post.category.name}
                  </Link>
                </li>
              )}
            </ol>
          </nav>

          <h1 className="blog-hero__title blog-board-title blog-board-title--article">{post.title}</h1>

          <div className="blog-hero__search blog-board-byline">
            {post.author?.avatar_url ? (
              <Image
                src={post.author.avatar_url}
                alt=""
                width={44}
                height={44}
                sizes="44px"
                className="blog-board-byline__avatar"
              />
            ) : (
              <span className="blog-board-byline__avatar blog-board-byline__avatar--initial" aria-hidden="true">
                {author.charAt(0)}
              </span>
            )}
            <div className="grid gap-1">
              <span className="blog-board-byline__name">{author}</span>
              <div className="blog-board-meta numeric">
                <time dateTime={post.published_at || undefined}>{formatDate(post.published_at)}</time>
                {post.reading_time_minutes && (
                  <span>
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {post.reading_time_minutes} min read
                  </span>
                )}
                {post.view_count != null && post.view_count > 0 && (
                  <span>
                    <Eye className="h-3 w-3" aria-hidden="true" />
                    {formatViewCount(post.view_count)} views
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {image && (
          <div className="blog-board-feature blog-board-feature--article blog-hero-animate">
            <div className="blog-board-bezel blog-board-feature__card blog-hero__search">
              <div className="blog-board-core blog-board-feature__core">
                <Image
                  src={image}
                  alt={post.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {post.category && (
                  <span className="blog-board-eyebrow blog-board-eyebrow--glass blog-board-feature__tag">
                    <i aria-hidden="true" />
                    {post.category.name}
                  </span>
                )}
              </div>
            </div>

            {post.reading_time_minutes && (
              <div className="blog-board-bezel blog-board-float blog-board-float--b" aria-hidden="true">
                <div className="blog-board-core blog-board-float__core">
                  <span className="blog-board-eyebrow">
                    <i />
                    Quick read
                  </span>
                  <b className="numeric">{post.reading_time_minutes} min</b>
                  <small>to read, start to finish</small>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
