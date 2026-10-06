import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, Clock } from "lucide-react"
import type { PublicBlogPost } from "@/lib/blog/queries"
import { formatDate } from "../utils"
import { BoardClock } from "./board-clock"
import { BoardSearch } from "./board-search"

interface BoardHeroProps {
  total: number
  topicCount: number
  featured: PublicBlogPost | null
  initialSearch?: string
  /** Replaces the "Infinia journal" pill, e.g. a breadcrumb on category pages. */
  eyebrow?: ReactNode
  /** Replaces the default headline. */
  title?: ReactNode
  subtitle?: string
  /** Pill on the featured card. */
  featuredLabel?: string
}

/**
 * /blog hero: headline, search and figures on the left; the featured post on
 * the right with two floating cards over its corners. Without a featured post
 * (page 2+, or a search) the right column is dropped.
 */
export function BoardHero({
  total,
  topicCount,
  featured,
  initialSearch,
  eyebrow,
  title,
  subtitle = 'Terminals, drive times and districts across Dubai, from the dispatch desk that runs your transfer.',
  featuredLabel = 'Featured',
}: BoardHeroProps) {
  return (
    <section aria-labelledby="blog-heading" className="blog-board-hero">
      <div className={`luxury-container blog-board-hero__grid${featured ? '' : ' blog-board-hero__grid--single'}`}>
        <div className="blog-hero-animate">
          {eyebrow ?? (
            <p className="blog-hero__eyebrow blog-board-eyebrow">
              <i aria-hidden="true" />
              Infinia journal
            </p>
          )}
          <h1 id="blog-heading" className="blog-hero__title blog-board-title">
            {title ?? <>Read it before you <span>land.</span></>}
          </h1>
          <p className="blog-hero__subtitle blog-board-sub">{subtitle}</p>
          <div className="blog-hero__search">
            <BoardSearch key={initialSearch ?? ''} initialSearch={initialSearch ?? ''} />
            <dl className="blog-board-figures numeric">
              <div>
                <dt>Articles</dt>
                <dd>{total}</dd>
              </div>
              {topicCount > 0 && (
                <div>
                  <dt>Topics</dt>
                  <dd>{topicCount}</dd>
                </div>
              )}
              <div>
                <dt>Local time</dt>
                <dd><BoardClock /></dd>
              </div>
            </dl>
          </div>
        </div>

        {featured && <FeaturedBoard post={featured} label={featuredLabel} />}
      </div>
    </section>
  )
}

function FeaturedBoard({ post, label }: { post: PublicBlogPost; label: string }) {
  const href = `/blog/${post.slug}`
  const summary = post.excerpt || post.content

  return (
    <div className="blog-board-feature blog-hero-animate">
      <Link href={href} aria-label={post.title} className="blog-board-bezel blog-board-feature__card blog-hero__search">
        <div className="blog-board-core blog-board-feature__core">
          {post.featured_image_url ? (
            <Image
              src={post.featured_image_url}
              alt=""
              fill
              priority
              className="blog-board-feature__img object-cover"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
          ) : (
            <div className="absolute inset-0 bg-[var(--charcoal)]" aria-hidden="true" />
          )}
          <div className="blog-board-feature__shade" aria-hidden="true" />
          {post.category && (
            <span className="blog-board-eyebrow blog-board-eyebrow--glass blog-board-feature__tag">
              <i aria-hidden="true" />
              {post.category.name}
            </span>
          )}
          <div className="blog-board-feature__label">
            <span className="blog-board-eyebrow blog-board-eyebrow--dark">
              <i aria-hidden="true" />
              {label}
            </span>
            <h2>{post.title}</h2>
            <div className="blog-board-feature__meta numeric">
              <span>{formatDate(post.published_at)}</span>
              {post.reading_time_minutes && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {post.reading_time_minutes} min read
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {summary && (
        <Link href={href} className="blog-board-bezel blog-board-float blog-board-float--a" tabIndex={-1} aria-hidden="true">
          <div className="blog-board-core blog-board-float__core">
            <p className="line-clamp-2">{summary}</p>
            <span className="blog-board-go">
              Read the article
              <span className="blog-board-go__ic"><ArrowUpRight className="h-[15px] w-[15px]" strokeWidth={1.5} /></span>
            </span>
          </div>
        </Link>
      )}

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
  )
}
