"use client"
import Image from 'next/image'
import { motion, useReducedMotion } from "motion/react"

interface City {
  name: string
  meta: string
  image: string
  alt: string
}

const CITIES: City[] = [
  {
    name: 'Downtown',
    meta: '214 routes',
    image: '/images/cities/downtown.webp',
    alt: 'Burj Khalifa above the Sheikh Zayed Road interchange at dusk',
  },
  {
    name: 'Palm Jumeirah',
    meta: '96 routes',
    image: '/images/cities/palm-jumeirah.webp',
    alt: 'The fronds of Palm Jumeirah and Atlantis seen from the air at dawn',
  },
  {
    name: 'Dubai Marina',
    meta: '147 routes',
    image: '/images/cities/dubai-marina.webp',
    alt: 'Cayan Tower and the Dubai Marina berths seen across the water',
  },
  {
    name: 'Dubai Creek',
    meta: '63 routes',
    image: '/images/cities/dubai-creek.webp',
    alt: 'Abras crossing the creek in front of the old Deira waterfront',
  },
]

/**
 * Photo grading and scrim alphas, lifted verbatim from the artifact and scoped
 * to this section rather than added to globals.css.
 *
 * Both follow the theme on purpose. In light the photo keeps its brightness and
 * the scrim washes it toward off-white, so the card reads pale and airy under
 * dark caption text. In dark the photo is dimmed to 60% and the scrim settles
 * toward near-black under light caption text. --void-rgb and --rich-rgb already
 * flip on their own, so the gradients below are written once.
 */
const SCRIM_TOKENS = [
  '[--scrim-anchor:0.84] dark:[--scrim-anchor:0.90]',
  '[--scrim-mid:0.52]',
  '[--scrim-open:0.10]',
  '[--media-filter:saturate(0.86)_contrast(0.98)_brightness(1)]',
  'dark:[--media-filter:saturate(0.9)_contrast(1.05)_brightness(0.6)]',
].join(' ')

const SCRIM =
  'bg-[linear-gradient(to_top,rgba(var(--void-rgb),var(--scrim-anchor))_0%,rgba(var(--rich-rgb),var(--scrim-mid))_44%,rgba(var(--void-rgb),var(--scrim-open))_100%),linear-gradient(to_right,rgba(var(--void-rgb),var(--scrim-mid))_0%,transparent_64%)]'

/**
 * Reveal props are shaped so that `whileInView` is ALWAYS supplied, and reduced
 * motion only collapses the duration and offset to zero.
 *
 * The idiom used elsewhere on this page, `whileInView={reduceMotion ? undefined
 * : ...}`, looks equivalent and is not. `useReducedMotion()` resolves to false
 * during SSR, so motion serialises `opacity: 0` into the markup; after hydration
 * it flips to true, `whileInView` becomes undefined, and nothing ever animates
 * the element back. Reduced-motion users get a permanently invisible section.
 */
export function Cities() {
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="cities-heading"
      className={`editorial-section--raised ${SCRIM_TOKENS}`}
    >
      <div className="luxury-container">
        <motion.header
          className="max-w-2xl"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <div className="editorial-eyebrow">Where we run</div>
          <h2 id="cities-heading" className="editorial-section-title mt-5">
            Every corner of Dubai, one clock.
          </h2>
          <p className="editorial-body mt-6 mb-[clamp(2.5rem,5vw,4rem)]">
            Every pickup, confirmation and cut-off on this site runs on Dubai time, whatever
            your phone is set to. No mental arithmetic at 5am.
          </p>
        </motion.header>
      </div>

      {/* Full bleed, so it sits outside .luxury-container. The 1px gap over a
          --graphite ground is what draws the hairlines between cards. */}
      <ul className="grid grid-cols-2 gap-px bg-[var(--graphite)] min-[900px]:grid-cols-4">
        {CITIES.map((city, index) => (
          <motion.li
            key={city.name}
            className="relative isolate flex min-h-[clamp(17rem,30vw,25rem)] items-end overflow-hidden bg-[var(--black-rich)]"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.45,
              delay: reduceMotion ? 0 : index * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
            viewport={{ once: true, amount: 0.3 }}
          >
            {/* unoptimized: /images is not in proxy.ts's MAINTENANCE_EXEMPT_PREFIXES,
                so while maintenance mode is on the asset URL answers with the
                maintenance page. The optimizer re-fetches the source server-side
                without the viewer's cookies, gets that HTML, and 400s with "The
                requested resource isn't a valid image" for everyone, signed in or
                not. Serving the file directly sidesteps it, and costs little:
                these are already WebP at exactly the rendered 640x860, 63-138 KB
                each, and the section sits below the fold so they load lazily. */}
            <Image
              src={city.image}
              alt={city.alt}
              fill
              unoptimized
              sizes="(min-width: 900px) 25vw, 50vw"
              className="z-0 object-cover [filter:var(--media-filter)]"
            />
            <div className={`pointer-events-none absolute inset-0 z-[1] ${SCRIM}`} />
            <div className="relative z-[2] w-full p-6">
              <h3 className="text-[1.375rem] font-medium leading-tight tracking-[-0.02em] text-[var(--text-primary)]">
                {city.name}
              </h3>
              {/* --text-secondary, not the artifact's --text-muted. Over the
                  light-mode wash the muted tone measures 4.2:1, under the 4.5:1
                  WCAG AA floor for text this size; secondary clears it and is a
                  half-step darker, which is not visible at 13px. */}
              <p className="numeric mt-[0.3rem] text-[0.8125rem] text-[var(--text-secondary)]">
                {city.meta}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  )
}
