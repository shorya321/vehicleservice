"use client"
import { motion, useReducedMotion } from "motion/react"

interface Benefit {
  index: string
  title: string
  body: string
  meta: string
}

const benefits: Benefit[] = [
  {
    index: "01",
    title: "Booked in under two minutes.",
    body: "Search any route, pick a vehicle, create a free account at checkout. One-time setup, then every return booking is even faster. No partner ads or upsell screens between you and the confirmation.",
    meta: "Search → Select → Confirm",
  },
  {
    index: "02",
    title: "Met at the door, not at a sign.",
    body: "Your chauffeur arrives at the agreed gate, terminal, or address. For airport pickups, flight tracking adjusts the meet time without you having to write.",
    meta: "Chauffeur at the gate",
  },
  {
    index: "03",
    title: "One price, in the currency you booked.",
    body: "Fixed pricing at the moment of booking. No surge, no tip prompt, no waiting-time surcharge for traffic on the airport road.",
    meta: "Multi-currency pricing",
  },
]

export function TransportationBenefits() {
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
          <div className="editorial-eyebrow">The promise</div>
          <h2 id="benefits-heading" className="editorial-section-title mt-5">
            Specifics, not adjectives.
          </h2>
          <p className="editorial-body mt-6">
            Three things we hold ourselves to on every transfer. Each one is measurable.
          </p>
        </motion.header>

        {/* Straight 1 to 3 at 900px, with no 2-col step: three items in two
            columns leaves one of them stranded on its own row. */}
        <ol className="mt-12 grid grid-cols-1 gap-5 min-[900px]:grid-cols-3">
          {benefits.map((p, index) => (
            <motion.li
              key={p.index}
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
              <span className="promise-card__index numeric">{p.index}</span>
              <h3 className="editorial-list-title">{p.title}</h3>
              <p className="editorial-list-body">{p.body}</p>
              <span className="promise-card__foot editorial-list-meta">{p.meta}</span>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
