import type { ReactNode } from "react"
import type { PublicBlogCategory, PublicBlogPost } from "@/lib/blog/queries"
import { BlogMotionSection } from "./blog-motion-wrapper"
import { BoardTabs } from "./board-tabs"
import { BoardCard } from "./board-card"

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

/** Heading + category control, then the card grid. Shared by /blog and category pages. */
export function BoardLatest({ eyebrow, heading, note, categories, posts, empty, children }: BoardLatestProps) {
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
            {posts.map(post => (
              <BoardCard key={post.id} post={post} />
            ))}
          </div>
        ) : empty ?? null}

        {children}
      </div>
    </section>
  )
}
