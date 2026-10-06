import Image from "next/image"
import type { PublicBlogPost } from "@/lib/blog/queries"

interface ArticleBoardAuthorProps {
  author: PublicBlogPost['author']
}

/** "Written by" card in a double-bezel frame, under the article body. */
export function ArticleBoardAuthor({ author }: ArticleBoardAuthorProps) {
  const name = author?.full_name || 'Editorial Team'

  return (
    <section aria-label="About the author" className="blog-board-bezel blog-board-author">
      <div className="blog-board-core blog-board-author__core">
        {author?.avatar_url ? (
          <Image
            src={author.avatar_url}
            alt=""
            width={72}
            height={72}
            sizes="72px"
            loading="lazy"
            className="blog-board-author__avatar"
          />
        ) : (
          <span className="blog-board-author__avatar blog-board-byline__avatar--initial" aria-hidden="true">
            {name.charAt(0)}
          </span>
        )}
        <div className="grid gap-1">
          <span className="blog-board-eyebrow justify-self-start">
            <i aria-hidden="true" />
            Written by
          </span>
          <h2 className="blog-board-author__name">{name}</h2>
          {name !== 'Editorial Team' && (
            <p className="blog-board-author__role">Infinia Transfers Editorial</p>
          )}
        </div>
      </div>
    </section>
  )
}
