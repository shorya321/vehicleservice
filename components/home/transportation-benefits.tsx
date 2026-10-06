"use client"
import { motion, useReducedMotion } from "motion/react"

import type { HomeContent } from "@/lib/cms/templates/home/schema"

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

        {/* Straight 1 to 3 at 900px, with no 2-col step: three items in two
            columns leaves one of them stranded on its own row. */}
        <ol className="mt-12 grid grid-cols-1 gap-5 min-[900px]:grid-cols-3">
          {content.items.map((p, index) => (
            <motion.li
              key={index}
              className="promise-card"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.45,
                delay: reduceMotion ? 0 : index * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <span className="promise-card__index numeric">{String(index + 1).padStart(2, '0')}</span>
              <h3 className="editorial-list-title">{p.title}</h3>
              <p className="editorial-list-body">{p.body}</p>
              {p.meta && <span className="promise-card__foot editorial-list-meta">{p.meta}</span>}
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
