'use client'

import { motion, useReducedMotion } from 'motion/react'
import { type ReactNode } from 'react'

interface BlogMotionSectionProps {
  children: ReactNode
  className?: string
  withScale?: boolean
}

export function BlogMotionSection({ children, className, withScale }: BlogMotionSectionProps) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={withScale ? { opacity: 0, y: 16, scale: 1.02 } : { opacity: 0, y: 16 }}
      whileInView={withScale ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, amount: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
