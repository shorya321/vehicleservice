"use client"
import { motion, useReducedMotion } from "motion/react"
import Link from 'next/link'
import { Instagram, Linkedin, Facebook, Twitter, Youtube } from "lucide-react"

interface FooterLinkCategory {
  title: string
  links: { name: string; href: string }[]
}

const footerLinkCategories: FooterLinkCategory[] = [
  {
    title: "Navigation",
    links: [
      { name: "Home", href: "/" },
      { name: "Services", href: "#services" },
      { name: "Fleet", href: "#fleet" },
      { name: "FAQ", href: "#faq" },
      { name: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Transfers",
    links: [
      { name: "Airport transfers", href: "/search" },
      { name: "City transfers", href: "/search" },
      { name: "Chauffeur hire", href: "/search" },
      { name: "Corporate travel", href: "/search" },
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

const socialMediaLinks = [
  { icon: Instagram, href: "#", name: "Instagram" },
  { icon: Linkedin, href: "#", name: "LinkedIn" },
  { icon: Facebook, href: "#", name: "Facebook" },
  { icon: Twitter, href: "#", name: "Twitter" },
  { icon: Youtube, href: "#", name: "Youtube" },
]

export function Footer() {
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
              aria-label="Infinia Transfers, go to homepage"
              className="footer-logo text-2xl"
            >
              Infinia <span>Transfers</span>
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
                    href="mailto:support@infiniatransfers.com"
                    aria-label="Email support"
                    className="text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
                  >
                    support@infiniatransfers.com
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  24 / 7
                </dt>
                <dd className="mt-1 numeric">
                  <a
                    href="tel:+971501234567"
                    aria-label="Call support"
                    className="text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
                  >
                    +971 50 123 4567
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
                {category.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-[0.875rem] text-[var(--text-secondary)] hover:text-[var(--gold-text-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-[var(--graphite)] pt-6 sm:flex-row sm:items-center">
          <p
            className="text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--text-muted)]"
            suppressHydrationWarning
          >
            © {new Date().getFullYear()} Infinia Transfers
          </p>

          <ul className="flex items-center gap-3">
            {socialMediaLinks.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center border border-[var(--graphite)] text-[var(--text-secondary)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
