"use client"
import { motion } from "motion/react"
import Link from 'next/link'
import { Instagram, Linkedin, Facebook, Twitter, Youtube } from "lucide-react"

const footerLinkCategories = [
  {
    title: "Navigation",
    links: [
      { name: "Home", href: "/" },
      { name: "Services", href: "#services" },
      { name: "Fleet", href: "#fleet" },
      { name: "FAQ", href: "#faq" },
      { name: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { name: "Airport Transfers", href: "/search" },
      { name: "City Transfers", href: "/search" },
      { name: "Chauffeur Hire", href: "#" },
      { name: "Corporate Travel", href: "#" },
    ],
  },
  {
    title: "Business",
    links: [
      { name: "Corporate Clients", href: "#" },
      { name: "API Solutions", href: "#" },
      { name: "Partner With Us", href: "/become-vendor" },
      { name: "Business Portal", href: "/business" },
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
  return (
    <footer className="footer-luxury" id="contact">
      {/* Decorative Top Border */}
      <div className="footer-border"></div>

      <div className="py-16 lg:py-20">
        <div className="luxury-container">
          {/* Asymmetric Four Column Grid - Brand wider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-12 mb-16">
            {/* Brand Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
            >
              <Link href="/" className="footer-logo text-2xl mb-6 block">
                Infinia <span>Transfers</span>
              </Link>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6">
                Premium luxury transfer services across the UAE. Experience unparalleled comfort with our professional chauffeur service.
              </p>
              <a
                href="mailto:support@infiniatransfers.com"
                className="text-[var(--gold)] hover:text-[var(--gold-light)] text-sm transition-colors"
              >
                support@infiniatransfers.com
              </a>
              <p className="text-[var(--text-muted)] text-xs mt-2">Available 24/7</p>
            </motion.div>

            {/* Link Columns */}
            {footerLinkCategories.map((category, catIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (catIndex + 1) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
              >
                <h4 className="footer-heading">{category.title}</h4>
                <ul className="space-y-3">
                  {category.links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="footer-link">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Bottom Bar */}
          <motion.div
            className="footer-bottom"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <p className="text-xs text-[var(--text-muted)]">
              © {new Date().getFullYear()} Infinia Transfers. All Rights Reserved.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              {socialMediaLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social"
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}