"use client"
import Image from 'next/image'
import { motion, useReducedMotion } from "motion/react"

interface Extra {
  title: string
  body: string
  meta: string
  /** Present on the two photographic cells, absent on the two typographic ones. */
  image?: {
    src: string
    alt: string
    /**
     * Where to anchor the cover crop. Both photos put their subject off-centre,
     * and the two cells crop on opposite axes, so neither can take the default.
     */
    position: string
  }
}

/**
 * Order matters. The bento places cells by position, not by name: the two
 * photographic cells have to come first so the wide tile and the tall tile land
 * in the right slots. See PLACEMENT below.
 */
const extras: Extra[] = [
  {
    title: "Child seats",
    body: "Age-appropriate seating provided on request: infant (up to 10kg), toddler (9-18kg), or booster (15-36kg). Installed before pickup.",
    meta: "Added at checkout",
    image: {
      src: '/images/onboard/child-seat.webp',
      alt: 'A father fastening a toddler into a child seat in the back of a car',
      // Wide tile, so the crop is vertical. Centre would cut both faces off at
      // the chin; 42% keeps the adult and the child in frame.
      position: 'object-[center_42%]',
    },
  },
  {
    title: "Wi-Fi and refreshments",
    body: "Complimentary on every transfer. Onboard router with international roaming, bottled water, and a selection of soft drinks.",
    meta: "Included",
    image: {
      src: '/images/onboard/in-car-refreshments.webp',
      alt: 'Two iced drinks resting in a car console, city towers through the window behind',
      // Tall tile against a portrait source, so the crop is slight and vertical.
      // The glasses sit low in the frame and the caption scrim is heaviest at
      // the bottom, so pull the crop down to lift them clear of it.
      position: 'object-[center_62%]',
    },
  },
  {
    title: "Extended waiting",
    body: "Hold the vehicle for an additional hour beyond the included grace period. Useful for delayed bag drop, customs, or unscheduled stops.",
    meta: "+1 hour included free",
  },
  {
    title: "Escorted from arrivals",
    body: "Chauffeur waits inside arrivals with a signed name placard and walks you to the vehicle. Default on every airport transfer.",
    meta: "Included",
  },
]

/**
 * 2x2 bento: one wide tile, one tall tile down the right spanning both rows,
 * two small tiles beneath the wide one. Four items, four cells, no empty slot.
 * Below 800px it collapses to a single column and these all no-op.
 */
const PLACEMENT = [
  'min-[800px]:col-start-1 min-[800px]:col-end-3 min-[800px]:row-start-1 min-[800px]:row-end-2',
  'min-[800px]:col-start-3 min-[800px]:col-end-4 min-[800px]:row-start-1 min-[800px]:row-end-3',
  'min-[800px]:col-start-1 min-[800px]:col-end-2 min-[800px]:row-start-2 min-[800px]:row-end-3',
  'min-[800px]:col-start-2 min-[800px]:col-end-3 min-[800px]:row-start-2 min-[800px]:row-end-3',
]

/**
 * Photo grading, scrim and caption colours are literals rather than theme
 * tokens, and that is deliberate: the scrim stays dark in BOTH themes, so the
 * ground under these captions never lightens and the type over it must not
 * follow the theme either. Tokenising them would break light mode, not fix it.
 *
 * This is a different choice from the one `cities.tsx` makes a few sections up
 * the page, where the scrim does follow the theme and light mode reads pale.
 * Both are correct for their own section; neither is a mistake to reconcile.
 */
const PHOTO_FILTER = '[filter:saturate(0.64)_contrast(1.06)_brightness(0.86)]'

const PHOTO_SCRIM =
  'bg-[linear-gradient(180deg,rgba(5,5,6,0.30)_0%,rgba(5,5,6,0.58)_42%,rgba(5,5,6,0.93)_100%)]'

/**
 * Reveal props are shaped so `whileInView` is ALWAYS supplied, with reduced
 * motion collapsing only the duration and the offset.
 *
 * The `whileInView={reduceMotion ? undefined : ...}` idiom this file used to
 * carry looks equivalent and is not: `useReducedMotion()` resolves false during
 * SSR, so motion serialises `opacity: 0` into the markup, then after hydration
 * flips true, `whileInView` becomes undefined, and nothing animates the section
 * back. Reduced-motion users got a permanently invisible section.
 */
export function AdditionalServices() {
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="extras-heading"
      className="editorial-section editorial-section--ground editorial-section--compact"
    >
      <div className="luxury-container">
        <motion.header
          className="max-w-2xl"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <div className="editorial-eyebrow">Onboard</div>
          <h2 id="extras-heading" className="editorial-section-title mt-5">
            Quietly included.
          </h2>
          <p className="editorial-body mt-6">
            The things travellers actually ask for, added at checkout or fitted before pickup. No upsell sequence.
          </p>
        </motion.header>

        <ul className="mt-12 grid grid-cols-1 gap-5 min-[800px]:grid-cols-[1fr_1fr_0.92fr]">
          {extras.map((extra, index) => (
            <motion.li
              key={extra.title}
              className={`group relative isolate flex min-h-[15rem] flex-col overflow-hidden rounded-[8px] p-7 ${PLACEMENT[index]} ${
                extra.image
                  ? 'justify-end'
                  : 'justify-start border border-[var(--graphite)] bg-[var(--charcoal)]'
              }`}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.45,
                delay: reduceMotion ? 0 : index * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true, amount: 0.2 }}
            >
              {extra.image && (
                <>
                  {/* unoptimized: /images is not in proxy.ts's MAINTENANCE_EXEMPT_PREFIXES,
                      so while maintenance mode is on the asset URL answers with the
                      maintenance page. The optimizer re-fetches the source server-side
                      without the viewer's cookies, gets that HTML, and 400s with "The
                      requested resource isn't a valid image" for everyone, signed in or
                      not. Serving the file directly sidesteps it, and costs little:
                      these are already WebP at 40 KB and 67 KB, and the section sits
                      below the fold so they load lazily. */}
                  <Image
                    src={extra.image.src}
                    alt={extra.image.alt}
                    fill
                    unoptimized
                    sizes="(min-width: 800px) 60vw, 100vw"
                    // The easing is an inline style, not an `ease-[...]` class,
                    // because Tailwind emits no rule for arbitrary easing values
                    // in this project: every `ease-[cubic-bezier(...)]` on the
                    // page, including the three in vehicle-classes-client.tsx,
                    // computes to transition-transform's own ease-in-out default.
                    // Verified in the browser, not assumed.
                    style={{ transitionTimingFunction: 'var(--ease-luxury)' }}
                    className={`z-0 object-cover ${extra.image.position} transition-transform duration-700 group-hover:scale-[1.035] ${PHOTO_FILTER}`}
                  />
                  <div className={`pointer-events-none absolute inset-0 z-[1] ${PHOTO_SCRIM}`} />
                </>
              )}

              <div className="relative z-[2]">
                <h3 className={`editorial-list-title ${extra.image ? 'text-[#f8f6f3]' : ''}`}>
                  {extra.title}
                </h3>
                <p
                  className={`mt-2.5 max-w-[38ch] text-[0.9375rem] leading-[1.6] ${
                    extra.image ? 'text-[#cfcbc5]' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {extra.body}
                </p>
                <span
                  className={`editorial-list-meta mt-5 inline-block ${
                    extra.image ? 'text-[#d4c4a8]' : ''
                  }`}
                >
                  {extra.meta}
                </span>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
