"use client"

import { motion } from "motion/react"
import { ReactNode } from "react"

interface AnimatedCardProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function AnimatedCard({ children, delay = 0, className }: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  )
}
