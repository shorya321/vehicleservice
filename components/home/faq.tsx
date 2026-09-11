"use client"
import { useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { FaqPanel } from "./faq-panel"

export function FAQ() {
  const reduceMotion = useReducedMotion()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (index: number): void => {
    setOpenIndex((current) => (current === index ? null : index))
  }

  // `whileInView` is always supplied and reduced motion only collapses the
  // duration and offset. See components/home/cities.tsx for why the
  // `reduceMotion ? undefined : ...` shape leaves the section invisible.
  // amount 0.15: on a phone the stacked panel is taller than the viewport.
  return (
    <section
      aria-labelledby="faq-heading"
      className="editorial-section editorial-section--raised"
      id="faq"
    >
      <div className="luxury-container">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.15 }}
        >
          <FaqPanel openIndex={openIndex} onToggle={toggle} />
        </motion.div>
      </div>
    </section>
  )
}
