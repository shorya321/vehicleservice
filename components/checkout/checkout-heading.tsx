'use client'

import { motion, useReducedMotion } from 'motion/react'

interface CheckoutHeadingProps {
  /** `null` drops the eyebrow row entirely, for callers whose step rail already names the step. */
  eyebrow?: string | null
  title?: string
  subtitle?: string
}

export function CheckoutHeading({
  eyebrow = 'Secure checkout',
  title = 'Complete your booking',
  // The previous copy promised "we hold the vehicle for the next 15 minutes". No hold
  // logic exists anywhere in the codebase, so it was a claim the product could not keep.
  // Cancellation terms are both true and a stronger reassurance at this point in the flow.
  subtitle = 'Confirm your passenger details and add any extras. The price is fixed at booking and free to cancel up to 24 hours before pickup.',
}: CheckoutHeadingProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="max-w-2xl"
      // `animate` is ALWAYS supplied. The `reduceMotion ? undefined` idiom looks
      // equivalent and is not: useReducedMotion() is false during SSR, so
      // opacity:0 is serialised into the markup and never animated back once
      // hydration flips the flag. Reduced motion collapses offset and duration.
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {eyebrow ? <p className="editorial-eyebrow">{eyebrow}</p> : null}
      {/* The shared ramp, not a bespoke clamp. Every h1 and h2 below a hero is one
          size across home, search results and now checkout. */}
      <h1 className={eyebrow ? 'editorial-section-title mt-5' : 'editorial-section-title'}>{title}</h1>
      <p className="editorial-body mt-6">{subtitle}</p>
    </motion.div>
  )
}

CheckoutHeading.displayName = 'CheckoutHeading'
