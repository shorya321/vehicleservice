'use client'

import { motion } from 'motion/react'

interface HamburgerButtonProps {
  isOpen: boolean
  onClick: () => void
}

const barTransition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const }

export function HamburgerButton({ isOpen, onClick }: HamburgerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden flex flex-col justify-center items-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-[var(--gold)]/20 hover:border-[var(--gold)]/40 transition-colors duration-300 gap-[5px]"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      <motion.span
        className="block w-4 sm:w-[18px] h-[1.5px] bg-[var(--text-primary)] rounded-full origin-center"
        animate={isOpen ? { rotate: 45, y: 6.5 } : { rotate: 0, y: 0 }}
        transition={barTransition}
      />
      <motion.span
        className="block w-4 sm:w-[18px] h-[1.5px] bg-[var(--text-primary)] rounded-full origin-center"
        animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={barTransition}
      />
      <motion.span
        className="block w-4 sm:w-[18px] h-[1.5px] bg-[var(--text-primary)] rounded-full origin-center"
        animate={isOpen ? { rotate: -45, y: -6.5 } : { rotate: 0, y: 0 }}
        transition={barTransition}
      />
    </button>
  )
}
