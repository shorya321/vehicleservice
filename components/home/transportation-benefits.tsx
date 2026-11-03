"use client"
import { motion, useReducedMotion } from "motion/react"

import type { HomeContent } from "@/lib/cms/templates/home/schema"
import { PromiseRoute } from "./promise-route"

interface TransportationBenefitsProps {
  content: HomeContent['benefits']
}

export function TransportationBenefits({ content }: TransportationBenefitsProps) {
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="benefits-heading"
      className="editorial-section editorial-section--ground"
    >
      <div className="luxury-container">
        {/*
          `whileInView` is ALWAYS supplied, with reduced motion collapsing only
          the duration and offset. The `whileInView={reduceMotion ? undefined :
          ...}` shape this file used to carry looks equivalent and is not:
          useReducedMotion() resolves false during SSR, so motion serialises
          opacity: 0 into the markup, then after hydration flips true,
          whileInView becomes undefined, and nothing animates the section back.
          Reduced-motion users got a permanently invisible section.
        */}
        <motion.header
          className="max-w-2xl"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <div className="editorial-eyebrow editorial-eyebrow--pill">
            <i aria-hidden="true" />
            {content.eyebrow}
          </div>
          <h2 id="benefits-heading" className="editorial-section-title mt-5">
            {content.title}
          </h2>
          {content.body && <p className="editorial-body mt-6">{content.body}</p>}
        </motion.header>

        <PromiseRoute items={content.items} />
      </div>
    </section>
  )
}
