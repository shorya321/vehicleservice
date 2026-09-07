"use client"
import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

export function TestimonialsAnimator({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion()

  // `whileInView` is always supplied and reduced motion only collapses the
  // duration and offset. See components/home/cities.tsx for why the
  // `reduceMotion ? undefined : ...` shape leaves the section invisible.
  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, amount: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
