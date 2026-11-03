'use client'

import { CarFront, CreditCard, UserRound, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

/* By position: every variant runs choose a vehicle, confirm and pay, meet
   the chauffeur. Same ringed-icon card as the home promise route. */
const STEP_ICONS: LucideIcon[] = [CarFront, CreditCard, UserRound]

export interface BookingStep {
  index: string
  title: string
  body: string
  foot: string
}

/**
 * "What happens next": the numbered sequence after Select. Shared by the
 * transfer and hourly results pages, which differ only in the step copy.
 */
export function BookingStepsBand({ steps }: { steps: readonly BookingStep[] }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section className="editorial-section editorial-section--ground editorial-section--compact">
      <div className="luxury-container">
        <motion.header
          className="max-w-2xl"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <p className="editorial-eyebrow editorial-eyebrow--pill"><i aria-hidden="true" />What happens next</p>
          <h2 className="editorial-section-title mt-5">Three steps from here to pickup.</h2>
        </motion.header>

        <ul className="mt-12 grid list-none grid-cols-1 gap-5 p-0 min-[900px]:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? CarFront
            return (
            <motion.li
              key={step.index}
              className="steps-card"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.45,
                delay: prefersReducedMotion ? 0 : index * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <span className="steps-card__icon" aria-hidden="true">
                <Icon size={18} strokeWidth={1.6} />
              </span>
              <h3 className="editorial-list-title">{step.title}</h3>
              <p className="editorial-list-body">{step.body}</p>
              <span className="steps-card__foot editorial-list-meta">{step.foot}</span>
            </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
