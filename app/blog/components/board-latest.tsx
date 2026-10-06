import type { ReactNode } from "react"
import type { PublicBlogCategory, PublicBlogPost } from "@/lib/blog/queries"
import { BlogMotionSection } from "./blog-motion-wrapper"
import { BoardTabs } from "./board-tabs"
import { BoardCard, boardSpanFor } from "./board-card"

interface BoardLatestProps {
  eyebrow: string
  heading: string
  /** Under the heading, e.g. a result count with a clear-search link. */
  note?: ReactNode
  categories: PublicBlogCategory[]
  posts: PublicBlogPost[]
  /** Shown when `posts` is empty; omit to show nothing. */
  empty?: ReactNode
  /** Pagination, rendered under the grid. */
  children?: ReactNode
}

/** Heading + category control, then the bento grid. Shared by /blog and category pages. */
export function BoardLatest({ eyebrow, heading, note, categories, posts, empty, children }: BoardLatestProps) {
  // The tall lead card needs two cards beside it; with fewer, every card is a plain tile.
  const hasLead = posts.length >= 3
  const tiles = hasLead ? posts.slice(1) : posts

  return (
    <section id="blog-content" aria-labelledby="blog-latest-heading" className="blog-board-scope blog-board-latest">
      <div className="luxury-container">
        <BlogMotionSection className="blog-board-head">
          <div>
            <p className="blog-board-eyebrow">
              <i aria-hidden="true" />
              {eyebrow}
            </p>
            <h2 id="blog-latest-heading" className="blog-board-h2">{heading}</h2>
            {note}
          </div>
          <BoardTabs categories={categories} />
        </BlogMotionSection>

        {posts.length > 0 ? (
          <div className="blog-board-bento">
            {hasLead && <BoardCard post={posts[0]} span={8} lead />}
            {tiles.map((post, index) => (
              <BoardCard
                key={post.id}
                post={post}
                span={hasLead ? boardSpanFor(index, tiles.length) : tiles.length === 1 ? 12 : 6}
              />
            ))}
          </div>
        ) : empty ?? null}

        {children}
      </div>
    </section>
  )
}
