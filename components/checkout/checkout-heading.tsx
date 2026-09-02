'use client'

import { motion, useReducedMotion } from 'motion/react'

interface CheckoutHeadingProps {
  eyebrow?: string
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
      className="mb-12"
      // `animate` is ALWAYS supplied. The `reduceMotion ? undefined` idiom looks
      // equivalent and is not: useReducedMotion() is false during SSR, so
      // opacity:0 is serialised into the markup and never animated back once
      // hydration flips the flag. Reduced motion collapses offset and duration.
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="editorial-eyebrow">{eyebrow}</p>
      {/* Weight 500 on the search-results scale. At weight 600 and hero size this
          out-ranked the price, which is backwards on a checkout. */}
      <h1 className="mt-[1.15rem] text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.028em] text-[var(--text-primary)]">
        {title}
      </h1>
      <p className="editorial-body mt-4">{subtitle}</p>
    </motion.div>
  )
}

CheckoutHeading.displayName = 'CheckoutHeading'
