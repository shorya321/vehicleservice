'use client'

import { motion } from 'framer-motion'

interface CheckoutHeadingProps {
  title?: string
  subtitle?: string
}

/**
 * Checkout Heading Component
 *
 * Animated heading section for checkout page with:
 * - Gold gradient text effect
 * - Decorative diamond divider
 * - Staggered entrance animation
 *
 * @component
 */
export function CheckoutHeading({
  title = 'Complete Your Booking',
  subtitle = 'Secure your premium transfer in just a few steps'
}: CheckoutHeadingProps) {
  return (
    <motion.div
      className="flex flex-col items-center text-center mb-12 md:mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Gold Gradient Title */}
      <motion.h1
        className="font-serif text-4xl md:text-5xl lg:text-6xl gold-text mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        {title}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-[#b8b4ae] text-lg mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {subtitle}
      </motion.p>

      {/* Decorative Divider */}
      <motion.div
        className="section-divider"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="section-divider-icon" />
      </motion.div>
    </motion.div>
  )
}

CheckoutHeading.displayName = 'CheckoutHeading'
