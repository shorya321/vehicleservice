'use client'

import { motion } from 'framer-motion'

interface CheckoutHeadingProps {
  title?: string
}

/**
 * Checkout Heading Component
 *
 * Animated heading section for checkout page with:
 * - Staggered entrance animation
 * - Spring animation on title
 * - Expanding gold separator
 *
 * @component
 */
export function CheckoutHeading({ title = 'Complete Your Booking' }: CheckoutHeadingProps) {
  return (
    <motion.div
      className="text-center mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.h1
        className="font-serif text-4xl md:text-5xl lg:text-6xl text-luxury-pearl mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        {title}
      </motion.h1>
      <motion.div
        className="w-20 h-1 bg-luxury-gold rounded-full mx-auto"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
      />
    </motion.div>
  )
}

CheckoutHeading.displayName = 'CheckoutHeading'
