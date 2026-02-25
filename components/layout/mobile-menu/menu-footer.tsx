'use client'

import { motion, type Variants } from 'motion/react'

interface MenuFooterProps {
  reducedMotion?: boolean
}

const footerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut', delay: 0.5 } },
}

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
    </motion.div>
  )
}
