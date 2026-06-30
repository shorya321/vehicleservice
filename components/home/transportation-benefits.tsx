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
    meta: "Meet-and-greet included",
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
        <motion.header
          className="max-w-2xl"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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

        <ol className="editorial-list mt-12">
          {benefits.map((p, index) => (
            <motion.li
              key={p.index}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <span className="editorial-list-index numeric">{p.index}</span>
              <div>
                <h3 className="editorial-list-title">{p.title}</h3>
                <p className="editorial-list-body">{p.body}</p>
              </div>
              <span className="editorial-list-meta hidden md:inline-block">{p.meta}</span>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
