"use client"
import { motion, useReducedMotion } from "motion/react"
import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Linkedin, Facebook, Twitter, Youtube } from "lucide-react"
import type { SiteSettingsConfig } from '@/lib/site-settings/types'
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings/types'

interface FooterProps {
  siteSettings?: SiteSettingsConfig
}

interface FooterLinkCategory {
  title: string
  links: { name: string; href: string }[]
}

const footerLinkCategories: FooterLinkCategory[] = [
  {
    title: "Navigation",
    links: [
      { name: "Home", href: "/" },
      { name: "Routes", href: "/routes" },
      { name: "Fleet", href: "/#fleet" },
      { name: "Reviews", href: "/reviews" },
      { name: "FAQ", href: "/#faq" },
      { name: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "Services", href: "/#services" },
      { name: "Partner with us", href: "/become-vendor" },
      { name: "Blog", href: "/blog" },
      { name: "Business", href: "/business/login" },
    ],
  },
]

/**
 * The three promises that close the page.
 *
 * Every claim here is contractual, not marketing, and follows the rule set by
 * `components/checkout/trust-block.tsx`. Sources, all in
 * `app/terms/components/terms-content.tsx`:
 *  - What the fixed fare covers  -> Booking & Payment / Pricing
 *  - Free cancellation to 24h    -> Cancellation & Refund Policy
 *  - Flight tracking and waiting -> Service Delivery / Waiting Time
 *
 * Do not add a fourth entry without a Terms clause behind it.
 */
const FOOTER_GUARANTEES = [
  {
    label: 'Fixed price',
    body: 'Vehicle, chauffeur, fuel, tolls and parking. The fare you see is the fare you pay.',
  },
  {
    label: 'Cancellation',
    body: 'Free up to 24 hours before pickup. Full refund if we cancel on you.',
  },
  {
    label: 'Airport pickup',
    body: 'We track your flight. 60 minutes of free waiting from the moment you land.',
  },
] as const

const SOCIAL_ICON_MAP: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
}

// One focus treatment for the whole footer. Matches the pattern repeated across
// the header and the drawer; the offset ground follows the footer's own tone
// step, or the ring would draw a hairline of the page colour instead.
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]"

export function Footer({ siteSettings }: FooterProps) {
  const settings = siteSettings ?? DEFAULT_SITE_SETTINGS
  const reduceMotion = useReducedMotion()

  // `whileInView` is ALWAYS supplied, on the container and on every child. The
  // `reduceMotion ? undefined` idiom looks equivalent and is not:
  // useReducedMotion() is false during SSR, so opacity:0 is serialised into the
  // markup and never animated back once hydration flips the flag. Reduced
  // motion collapses the offset, the duration and the stagger instead.
  const group = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.07 } },
  }
  const reveal = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduceMotion ? 0 : 0.6,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    },
  }

  return (
    <footer
      id="contact"
      // One tone step off the page ground. DESIGN.md is flat-by-tone: the footer
      // reads as a separate terminal plane through neutral stepping and a single
      // hairline, never through a shadow or a panel.
      className="border-t border-[var(--graphite)] bg-[var(--black-rich)] py-20 lg:py-24"
    >
      <div className="luxury-container">
        <motion.div
          className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-16"
          variants={group}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div variants={reveal} className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              aria-label={`${settings.brand_name}, go to homepage`}
              className={`footer-logo footer-wordmark inline-block rounded-[4px] ${FOCUS_RING}`}
            >
              {settings.footer_logo_url ? (
                <Image
                  src={settings.footer_logo_url}
                  alt={settings.brand_name}
                  width={180}
                  height={48}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <>{settings.brand_name.includes(' ') ? (
                  <>{settings.brand_name.split(' ').slice(0, -1).join(' ')} <span>{settings.brand_name.split(' ').pop()}</span></>
                ) : settings.brand_name}</>
              )}
            </Link>
            {/* Capped by measure, not by an arbitrary breakpoint width. */}
            <p className="mt-6 max-w-[46ch] text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
              Private airport and city transfers, fixed-price, worldwide. Search a route, pick a vehicle, book in minutes.
            </p>
          </motion.div>

          {footerLinkCategories.map((category) => (
            <motion.div key={category.title} variants={reveal}>
              {/* The three column heads share one rule at one height, so the
                  utility columns finally read as peers of each other rather
                  than as three unrelated stubs. */}
              <h4 className="t-label border-b border-[var(--graphite)] pb-4">
                {category.title}
              </h4>
              <ul className="mt-5 space-y-3">
                {category.links.map((link) => {
                  const linkClass = `footer-link text-[0.875rem] rounded-[2px] ${FOCUS_RING}`
                  return (
                    <li key={link.name}>
                      {link.href.includes('#') ? (
                        <a href={link.href} className={linkClass}>
                          {link.name}
                        </a>
                      ) : (
                        <Link href={link.href} className={linkClass}>
                          {link.name}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </motion.div>
          ))}

          <motion.div variants={reveal} className="sm:col-span-2 lg:col-span-1">
            <h4 className="t-label border-b border-[var(--graphite)] pb-4">
              Contact
            </h4>
            {/* Three utility columns is an odd number, so at the two-column
                tablet step this one would sit alone in half a row. It takes the
                whole row there and splits its own content instead. */}
            <div className="mt-5 grid gap-5 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-1 lg:gap-5">
              <div>
                {/* The phone is the only gold mark down here besides the
                    wordmark accent, and it takes the Numeric role: tabular
                    figures, half-step weight bump, sized to be read across a
                    phone at arm's length. */}
                <a
                  href={`tel:${settings.support_phone.replace(/\s/g, '')}`}
                  aria-label="Call reservations"
                  className={`numeric inline-block rounded-[2px] text-[1.0625rem] text-[var(--gold-text)] transition-colors duration-200 hover:text-[var(--gold-text-hover)] ${FOCUS_RING}`}
                >
                  {settings.support_phone}
                </a>
                <p className="mt-1 text-[0.8125rem] text-[var(--text-muted)]">
                  Reservations, 24 hours, every day
                </p>
              </div>

              <div className="space-y-4">
                <a
                  href={`mailto:${settings.support_email}`}
                  aria-label="Email support"
                  className={`footer-link block text-[0.875rem] text-[var(--text-primary)] hover:text-[var(--gold-text-hover)] rounded-[2px] ${FOCUS_RING}`}
                >
                  {settings.support_email}
                </a>

                {settings.office_address ? (
                  <address className="text-[0.875rem] not-italic leading-relaxed text-[var(--text-secondary)]">
                    {settings.office_address}
                  </address>
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Three contractual promises, set as statements rather than badges.
            DESIGN.md: trust is the absence of suspicion-triggering patterns. */}
        <div className="mt-14 grid grid-cols-1 gap-8 border-t border-[var(--graphite)] pt-10 sm:grid-cols-3 sm:gap-10">
          {FOOTER_GUARANTEES.map((item) => (
            <div key={item.label}>
              <h3 className="t-label">{item.label}</h3>
              <p className="mt-2 max-w-[42ch] text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-6 border-t border-[var(--graphite)] pt-8 sm:flex-row sm:items-center">
          {/* Copyright and legal are the same register, so they travel together
              as one anchored group instead of drifting to wherever the flex
              math lands them. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="t-label" suppressHydrationWarning>
              &copy; {new Date().getFullYear()} {settings.copyright_text}
            </p>
            <span className="hidden text-[var(--graphite)] sm:inline" aria-hidden="true">|</span>
            <nav aria-label="Legal" className="flex items-center gap-4">
              <Link
                href="/privacy"
                className={`t-label footer-link rounded-[2px] hover:text-[var(--gold-text)] ${FOCUS_RING}`}
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className={`t-label footer-link rounded-[2px] hover:text-[var(--gold-text)] ${FOCUS_RING}`}
              >
                Terms
              </Link>
            </nav>
          </div>

          <ul className="flex items-center gap-1">
            {Object.entries(settings.social_links)
              // Filtered on an icon existing, not just on a URL being set. A
              // configured platform with no glyph (tiktok) would otherwise pass
              // this filter and then render nothing at all, silently.
              .filter(([platform, url]) => url && url.length > 0 && SOCIAL_ICON_MAP[platform])
              .map(([platform, url]) => {
                const Icon = SOCIAL_ICON_MAP[platform]
                return (
                  <li key={platform}>
                    {/* 44px tap target wrapping the 36px drawn box, the same
                        way the mobile drawer handles its social row. */}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${FOCUS_RING}`}
                      aria-label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                    >
                      <span className="footer-social">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </a>
                  </li>
                )
              })}
          </ul>
        </div>
      </div>
    </footer>
  )
}
