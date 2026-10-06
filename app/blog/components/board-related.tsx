import type { PublicBlogPost } from "@/lib/blog/queries"
import { BlogMotionSection } from "./blog-motion-wrapper"
import { BoardCard } from "./board-card"

interface BoardRelatedProps {
  posts: PublicBlogPost[]
}

/** "Keep reading": up to three related articles as board cards. */
export function BoardRelated({ posts }: BoardRelatedProps) {
  const shown = posts.slice(0, 3)
  if (shown.length === 0) return null

  return (
    <section aria-labelledby="blog-related-heading" className="blog-board-latest">
      <div className="luxury-container">
        <BlogMotionSection className="blog-board-head">
          <div>
            <p className="blog-board-eyebrow">
              <i aria-hidden="true" />
              Keep reading
            </p>
            <h2 id="blog-related-heading" className="blog-board-h2">More from the desk.</h2>
          </div>
        </BlogMotionSection>
        <div className="blog-board-bento">
          {shown.map(post => (
            // Always a third of the row, so one or two related posts stay card-sized.
            <BoardCard key={post.id} post={post} span={4} />
          ))}
        </div>
      </div>
    </section>
  )
}
