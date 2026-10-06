import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, Clock } from "lucide-react"
import type { PublicBlogPost } from "@/lib/blog/queries"
import { formatDate } from "../utils"

export type BoardSpan = 4 | 6 | 8 | 12

interface BoardCardProps {
  post: PublicBlogPost
  span: BoardSpan
  lead?: boolean
}

// Literal class names so Tailwind emits them.
const SPAN_CLASS: Record<BoardSpan, string> = {
  4: 'lg:col-span-4',
  6: 'lg:col-span-6',
  8: 'lg:col-span-8',
  12: 'lg:col-span-12',
}

function Meta({ post }: { post: PublicBlogPost }) {
  return (
    <div className="blog-board-meta numeric">
      <span>{formatDate(post.published_at)}</span>
      {post.reading_time_minutes && (
        <span>
          <Clock className="h-3 w-3" aria-hidden="true" />
          {post.reading_time_minutes} min read
        </span>
      )}
    </div>
  )
}

/** Double-bezel article card. `lead` is the tall photo card that opens the grid. */
export function BoardCard({ post, span, lead = false }: BoardCardProps) {
  const summary = post.excerpt || post.content
  // One width per breakpoint: the lead and full-row tiles span the tablet row, others take half.
  const mdClass = lead || span === 12 ? 'md:col-span-12' : 'md:col-span-6'
  const spanClass = `${mdClass} ${SPAN_CLASS[span]}${lead ? ' lg:row-span-2' : ''}`

  return (
    <Link
      href={`/blog/${post.slug}`}
      aria-label={post.title}
      className={`blog-board-bezel blog-board-card ${lead ? 'blog-board-card--lead ' : ''}${!lead && span === 12 ? 'blog-board-card--wide ' : ''}${spanClass}`}
    >
      <div className="blog-board-core blog-board-card__core">
        <div className="blog-board-card__ph">
          {post.featured_image_url ? (
            <Image
              src={post.featured_image_url}
              alt=""
              fill
              className="object-cover"
              sizes={lead ? '(max-width: 1024px) 100vw, 66vw' : span === 12 ? '(max-width: 768px) 100vw, 55vw' : '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'}
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
          {lead && (
            <span className="blog-board-eyebrow blog-board-eyebrow--dark">
              <i aria-hidden="true" />
              Latest{post.category ? ` · ${post.category.name}` : ''}
            </span>
          )}
          {!lead && <Meta post={post} />}
          <h3>{post.title}</h3>
          {summary && <p className="line-clamp-2">{summary}</p>}
          {lead && <Meta post={post} />}
          <span className="blog-board-go blog-board-card__go">
            Read article
            <span className="blog-board-go__ic"><ArrowUpRight className="h-[15px] w-[15px]" strokeWidth={1.5} /></span>
          </span>
        </div>
      </div>
    </Link>
  )
}

/**
 * Spans for the cards after the lead. The first two stack beside the lead,
 * then rows of three; a short last row widens so it never leaves a gap.
 */
export function boardSpanFor(index: number, total: number): BoardSpan {
  if (index < 2) return 4
  const rest = total - 2
  const pos = index - 2
  const lastRowStart = rest - (rest % 3 || 3)
  if (pos < lastRowStart) return 4
  const lastRowSize = rest - lastRowStart
  return lastRowSize === 1 ? 12 : lastRowSize === 2 ? 6 : 4
}
