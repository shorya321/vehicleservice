import Image from "next/image"
import type { PublicBlogPost } from "@/lib/blog/queries"

interface AuthorSignoffProps {
  author: PublicBlogPost['author']
}

export function AuthorSignoff({ author }: AuthorSignoffProps) {
  const name = author?.full_name || 'Editorial Team'
  const initial = name.charAt(0)

  return (
    <section className="article-author-signoff" aria-label="About the author">
      <div className="article-author-signoff__inner">
        <div className="article-author-signoff__avatar-wrap">
          {author?.avatar_url ? (
            <Image
              src={author.avatar_url}
              alt={name}
              width={96}
              height={96}
              sizes="96px"
              loading="lazy"
              className="w-24 h-24 rounded-full object-cover border border-[var(--gold)]/12"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[var(--charcoal)] border border-[var(--gold)]/12 flex items-center justify-center">
              <span className="text-[var(--gold)] text-2xl font-medium">
                {initial}
              </span>
            </div>
          )}
        </div>
        <div className="article-author-signoff__content">
          <span className="article-author-signoff__label">Written by</span>
          <h3 className="article-author-signoff__name">{name}</h3>
          {name !== 'Editorial Team' && (
            <p className="article-author-signoff__role">
              Infinia Transfers Editorial
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
