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
      { name: "Services", href: "/#services" },
      { name: "Fleet", href: "/#fleet" },
      { name: "FAQ", href: "/#faq" },
      { name: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Transfers",
    links: [
      { name: "Airport transfers", href: "/#hero" },
      { name: "City transfers", href: "/#hero" },
      { name: "Chauffeur hire", href: "/#hero" },
      { name: "Corporate travel", href: "/#hero" },
    ],
  },
  {
    title: "Business",
    links: [
      { name: "Corporate clients", href: "/business" },
      { name: "API & integrations", href: "/business" },
      { name: "Partner with us", href: "/become-vendor" },
      { name: "Business portal", href: "/business" },
    ],
  },
]

const SOCIAL_ICON_MAP: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
}

export function Footer({ siteSettings }: FooterProps) {
  const settings = siteSettings ?? DEFAULT_SITE_SETTINGS
  const reduceMotion = useReducedMotion()

  return (
    <footer
      id="contact"
      className="border-t border-[var(--graphite)] bg-[var(--black-void)] py-16 lg:py-20"
    >
      <div className="luxury-container">
        <motion.div
          className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-16"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <Link
              href="/"
              aria-label={`${settings.brand_name}, go to homepage`}
              className="footer-logo text-2xl"
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
            <p className="mt-6 max-w-sm text-[0.9375rem] leading-relaxed text-[var(--text-secondary)]">
              Premium ground transfers, fixed-price, in 47 cities. Booked from a phone in under 90 seconds.
            </p>

            <dl className="mt-8 space-y-3 text-[0.875rem]">
              <div>
                <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Email
                </dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${settings.support_email}`}
                    aria-label="Email support"
                    className="text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
                  >
                    {settings.support_email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  24 / 7
                </dt>
                <dd className="mt-1 numeric">
                  <a
                    href={`tel:${settings.support_phone.replace(/\s/g, '')}`}
                    aria-label="Call support"
                    className="text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
                  >
                    {settings.support_phone}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          {footerLinkCategories.map((category) => (
            <div key={category.title}>
              <h4 className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {category.title}
              </h4>
              <ul className="mt-5 space-y-3">
                {category.links.map((link) => {
                  const linkClass = "text-[0.875rem] text-[var(--text-secondary)] hover:text-[var(--gold-text-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
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
            </div>
          ))}
        </motion.div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-[var(--graphite)] pt-6 sm:flex-row sm:items-center">
          <p
            className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]"
            suppressHydrationWarning
          >
            &copy; {new Date().getFullYear()} {settings.copyright_text}
          </p>

          <ul className="flex items-center gap-3">
            {Object.entries(settings.social_links)
              .filter(([, url]) => url && url.length > 0)
              .map(([platform, url]) => {
                const Icon = SOCIAL_ICON_MAP[platform]
                if (!Icon) return null
                return (
                  <li key={platform}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center border border-[var(--graphite)] text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
                      aria-label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
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
