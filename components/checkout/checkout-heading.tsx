'use client'

import { motion, useReducedMotion } from 'motion/react'

interface CheckoutHeadingProps {
  title?: string
  subtitle?: string
}

export function CheckoutHeading({
  title = 'Complete your booking',
  subtitle = 'Confirm passenger details and add any extras. We hold the vehicle while you check out.',
}: CheckoutHeadingProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="mb-12"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="editorial-eyebrow">Step 03 · Details</div>
      <h1 className="editorial-section-title mt-4">{title}</h1>
      <p className="editorial-body mt-4">{subtitle}</p>
    </motion.div>
  )
}

CheckoutHeading.displayName = 'CheckoutHeading'
