import Link from "next/link"
import Image from "next/image"
import type { PublicBlogCategory } from "@/lib/blog/queries"

interface BoardRailProps {
  categories: PublicBlogCategory[]
  /** Category to leave out, e.g. the one whose page this is. */
  excludeSlug?: string
}

// Site photos used when a category has no image of its own.
const FALLBACK_IMAGES = [
  '/images/cities/downtown.webp',
  '/images/cities/palm-jumeirah.webp',
  '/images/cities/dubai-marina.webp',
  '/images/cities/dubai-creek.webp',
]

/** "Where to next?": one tall photo card per blog category, in a snap rail. */
export function BoardRail({ categories, excludeSlug }: BoardRailProps) {
  const shown = excludeSlug ? categories.filter(c => c.slug !== excludeSlug) : categories
  if (shown.length === 0) return null

  return (
    <section aria-labelledby="blog-rail-heading" className="blog-board-rail-sec">
      <div className="luxury-container blog-board-head">
        <div>
          <p className="blog-board-eyebrow">
            <i aria-hidden="true" />
            Browse by topic
          </p>
          <h2 id="blog-rail-heading" className="blog-board-h2">Where to next?</h2>
        </div>
        <p className="blog-board-lede">
          Pickup points, drive times and the hours to avoid, gathered by topic.
        </p>
      </div>
      <div className="blog-board-rail">
        {shown.map((cat, index) => {
          const own = cat.image_url
          const src = own ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
          return (
            <Link key={cat.id} href={`/blog/category/${cat.slug}`} className="blog-board-bezel blog-board-pc">
              <div className="blog-board-core blog-board-pc__core">
                {/* unoptimized for the local fallbacks: /images is outside the
                    maintenance-exempt paths, so the optimizer's cookieless
                    re-fetch would get the maintenance page (see home Cities). */}
                <Image
                  src={src}
                  alt=""
                  fill
                  unoptimized={!own}
                  className="object-cover"
                  sizes="(max-width: 768px) 70vw, 20rem"
                />
                <div className="blog-board-pc__lbl">
                  <h3>{cat.name}</h3>
                  <span>{cat.description || 'Read the guides'}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
