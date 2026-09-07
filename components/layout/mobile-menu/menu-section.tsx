'use client'

import { motion, type Variants } from 'motion/react'
import { useId, type ReactNode } from 'react'

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
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
}

export function MenuSection({ label, children, reducedMotion }: MenuSectionProps) {
  const labelId = useId()
  return (
    <div className="space-y-2" role="group" aria-labelledby={labelId}>
      <motion.p
        id={labelId}
        className="flex items-center gap-2 px-4 text-[10px] font-body font-semibold tracking-[0.25em] uppercase text-[var(--gold-text)]"
        variants={reducedMotion ? undefined : labelVariants}
      >
        {/* Was bg-[var(--gold)]/60, which compiles to nothing on Tailwind 3, so
            the dash has never been visible. */}
        <span
          className="block w-3 h-px bg-[rgba(var(--gold-rgb),0.55)] shrink-0"
          aria-hidden="true"
        />
        {label}
      </motion.p>
      {/* Rows abut, so a run of them reads as one band under the press wash. */}
      <motion.div variants={reducedMotion ? undefined : containerVariants}>
        {children}
      </motion.div>
    </div>
  )
}
