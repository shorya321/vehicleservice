'use client'

import { motion, useReducedMotion } from 'motion/react'
import { type ReactNode } from 'react'

interface BlogMotionCardProps {
  children: ReactNode
  index?: number
}

export function BlogMotionCard({ children, index = 0 }: BlogMotionCardProps) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <>{children}</>

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

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

export function BlogMotionRule({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <span className={className} aria-hidden="true" />

  return (
    <motion.span
      className={className}
      aria-hidden="true"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      transition={{ duration: 0.25, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      style={{ transformOrigin: 'left', display: 'inline-block' }}
    />
  )
}
