"use client"
import { motion, useReducedMotion } from "motion/react"
import { JoinCommunityPlate } from "./join-community-plate"

export function JoinCommunity() {
  const reduceMotion = useReducedMotion()

  // `whileInView` is always supplied and reduced motion only collapses the
  // duration and offset. See components/home/cities.tsx for why the
  // `reduceMotion ? undefined : ...` shape leaves the section invisible.
  return (
    <section
      aria-labelledby="membership-heading"
      className="editorial-section editorial-section--ground"
    >
      <div className="luxury-container">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <JoinCommunityPlate />
        </motion.div>
      </div>
    </section>
  )
}
