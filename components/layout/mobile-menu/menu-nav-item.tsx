'use client'

import { motion, type Variants } from 'motion/react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface MenuNavItemProps {
  href: string
  label: string
  icon: LucideIcon
  onClick?: () => void
  reducedMotion?: boolean
  variant?: 'default' | 'danger'
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}

export function MenuNavItem({ href, label, icon: Icon, onClick, reducedMotion, variant = 'default' }: MenuNavItemProps) {
  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]'
  const className = variant === 'danger'
    ? `group flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors duration-200 text-sm font-body ${focusRing}`
    : `group flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg text-[var(--text-secondary)] hover:text-[var(--gold-text)] hover:bg-[var(--gold)]/5 transition-colors duration-200 text-sm font-body ${focusRing}`

  const content = (
    <>
      <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      <span>{label}</span>
    </>
  )

  if (href.startsWith('#') || href.startsWith('/#') || href.startsWith('tel:')) {
    return (
      <motion.a
        href={href}
        className={className}
        onClick={onClick}
        variants={reducedMotion ? undefined : itemVariants}
      >
        {content}
      </motion.a>
    )
  }

  return (
    <motion.div variants={reducedMotion ? undefined : itemVariants}>
      <Link href={href} className={className} onClick={onClick}>
        {content}
      </Link>
    </motion.div>
  )
}

interface MenuButtonItemProps {
  label: string
  icon: LucideIcon
  onClick: () => void
  reducedMotion?: boolean
  variant?: 'default' | 'danger'
}

export function MenuButtonItem({ label, icon: Icon, onClick, reducedMotion, variant = 'default' }: MenuButtonItemProps) {
  const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]'
  const className = variant === 'danger'
    ? `group flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors duration-200 text-sm font-body w-full text-left ${focusRing}`
    : `group flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg text-[var(--text-secondary)] hover:text-[var(--gold-text)] hover:bg-[var(--gold)]/5 transition-colors duration-200 text-sm font-body w-full text-left ${focusRing}`

  return (
    <motion.button
      className={className}
      onClick={onClick}
      variants={reducedMotion ? undefined : itemVariants}
    >
      <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      <span>{label}</span>
    </motion.button>
  )
}
