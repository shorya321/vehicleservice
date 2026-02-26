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
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export function MenuNavItem({ href, label, icon: Icon, onClick, reducedMotion, variant = 'default' }: MenuNavItemProps) {
  const className = variant === 'danger'
    ? 'group relative overflow-hidden flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors duration-200 text-sm font-body'
    : 'group relative overflow-hidden flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/5 transition-colors duration-200 text-sm font-body'

  const content = (
    <>
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[var(--gold)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      <span>{label}</span>
    </>
  )

  if (href.startsWith('#') || href.startsWith('tel:')) {
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
  const className = variant === 'danger'
    ? 'group relative overflow-hidden flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors duration-200 text-sm font-body w-full text-left'
    : 'group relative overflow-hidden flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/5 transition-colors duration-200 text-sm font-body w-full text-left'

  return (
    <motion.button
      className={className}
      onClick={onClick}
      variants={reducedMotion ? undefined : itemVariants}
    >
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[var(--gold)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      <span>{label}</span>
    </motion.button>
  )
}
