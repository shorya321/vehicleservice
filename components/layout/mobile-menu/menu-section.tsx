'use client'

import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

interface MenuSectionProps {
  label: string
  children: ReactNode
  reducedMotion?: boolean
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

const labelVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

export function MenuSection({ label, children, reducedMotion }: MenuSectionProps) {
  return (
    <div className="space-y-2">
      <motion.p
        className="text-[10px] font-body tracking-[0.25em] uppercase text-[var(--gold)] px-3"
        variants={reducedMotion ? undefined : labelVariants}
      >
        {label}
      </motion.p>
      <motion.div
        className="space-y-0.5"
        variants={reducedMotion ? undefined : containerVariants}
      >
        {children}
      </motion.div>
    </div>
  )
}
