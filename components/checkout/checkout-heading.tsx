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
      className="mb-10"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="t-label-accent">Step 03 · Details</div>
      <h1 className="t-headline mt-5 font-semibold">{title}</h1>
      <p className="t-body mt-5 max-w-2xl">{subtitle}</p>
    </motion.div>
  )
}

CheckoutHeading.displayName = 'CheckoutHeading'
