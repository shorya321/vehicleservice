"use client"
import { motion, useReducedMotion } from "motion/react"

interface Extra {
  index: string
  title: string
  body: string
  meta: string
}

const extras: Extra[] = [
  {
    index: "01",
    title: "Child seats",
    body: "Age-appropriate seating provided on request: infant (up to 10kg), toddler (9-18kg), or booster (15-36kg). Installed before pickup.",
    meta: "+ added at checkout",
  },
  {
    index: "02",
    title: "Extended waiting",
    body: "Hold the vehicle for an additional hour beyond the included grace period. Useful for delayed bag drop, customs, or unscheduled stops.",
    meta: "+1 hour included free",
  },
  {
    index: "03",
    title: "Wi-Fi and refreshments",
    body: "Complimentary on every transfer. Onboard router with international roaming, bottled water, and a selection of soft drinks.",
    meta: "Included",
  },
  {
    index: "04",
    title: "Escorted from arrivals",
    body: "Chauffeur waits inside arrivals with a signed name placard and walks you to the vehicle. Default on every airport transfer.",
    meta: "Included",
  },
]

export function AdditionalServices() {
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="extras-heading"
      className="editorial-section editorial-section--ground editorial-section--compact"
      id="services"
    >
      <div className="luxury-container">
        <motion.header
          className="max-w-2xl"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <div className="editorial-eyebrow">Onboard</div>
          <h2 id="extras-heading" className="editorial-section-title mt-5">
            Quietly included.
          </h2>
          <p className="editorial-body mt-6">
            The things travellers actually ask for, added at checkout or fitted before pickup. No upsell sequence.
          </p>
        </motion.header>

        <ul className="editorial-feature-grid mt-12">
          {extras.map((extra, index) => (
            <motion.li
              key={extra.index}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <h3 className="editorial-list-title">{extra.title}</h3>
              <p className="editorial-list-body mt-2">{extra.body}</p>
              <span className="editorial-list-meta mt-3 inline-block">{extra.meta}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
