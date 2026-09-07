'use client'

import { motion, useReducedMotion } from 'motion/react'

interface HamburgerButtonProps {
  isOpen: boolean
  onClick: () => void
}

const barTransition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const }
const instant = { duration: 0 }

export function HamburgerButton({ isOpen, onClick }: HamburgerButtonProps) {
  /* Every other file in this folder honours reduced motion; this one did not,
     so the bars rotated for people who asked for none. The morph still happens,
     it just arrives rather than travels. */
  const reducedMotion = useReducedMotion() ?? false
  const transition = reducedMotion ? instant : barTransition

  return (
    <button
      onClick={onClick}
      className="lg:hidden flex flex-col justify-center items-center w-11 h-11 rounded-lg border border-[var(--graphite)] hover:border-[var(--gold)] transition-colors duration-300 gap-[5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      <motion.span
        className="block w-4 sm:w-[18px] h-[1.5px] bg-[var(--text-primary)] rounded-full origin-center"
        animate={isOpen ? { rotate: 45, y: 6.5 } : { rotate: 0, y: 0 }}
        transition={transition}
      />
      <motion.span
        className="block w-4 sm:w-[18px] h-[1.5px] bg-[var(--text-primary)] rounded-full origin-center"
        animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={transition}
      />
      <motion.span
        className="block w-4 sm:w-[18px] h-[1.5px] bg-[var(--text-primary)] rounded-full origin-center"
        animate={isOpen ? { rotate: -45, y: -6.5 } : { rotate: 0, y: 0 }}
        transition={transition}
      />
    </button>
  )
}
