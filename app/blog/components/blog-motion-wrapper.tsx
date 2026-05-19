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
}

export function BlogMotionSection({ children, className }: BlogMotionSectionProps) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, amount: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
