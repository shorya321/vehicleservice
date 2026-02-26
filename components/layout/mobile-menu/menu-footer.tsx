'use client'

import { motion, type Variants } from 'motion/react'
import { Instagram, Facebook, Twitter } from 'lucide-react'

interface MenuFooterProps {
  reducedMotion?: boolean
}

const footerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut', delay: 0.5 } },
}

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
  { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
]

export function MenuFooter({ reducedMotion }: MenuFooterProps) {
  return (
    <motion.div
      className="mt-auto pt-4 px-3"
      variants={reducedMotion ? undefined : footerVariants}
    >
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--gold)]/30 to-transparent mb-4" />
      <p className="text-[10px] font-body tracking-[0.2em] uppercase text-[var(--text-muted)] text-center">
        Premium Transfer Services
      </p>
      <p className="footer-logo text-lg text-center mt-1">
        Infinia <span>Transfers</span>
      </p>
      <div className="flex items-center justify-center gap-4 mt-3">
        {socialLinks.map(({ icon: Icon, href, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="footer-social p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/5 transition-colors duration-200"
          >
            <Icon className="w-4 h-4" />
          </a>
        ))}
      </div>
      <p className="text-[9px] font-body text-[var(--text-muted)]/60 text-center mt-3 pb-2">
        &copy; 2026 Infinia Transfers
      </p>
    </motion.div>
  )
}
