"use client"
import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface FaqItem {
  question: string
  answer: string
}

const faqData: FaqItem[] = [
  {
    question: "How does pricing work?",
    answer:
      "Every transfer is fixed-price at the moment of booking. The number you see at checkout is the number on your card. No surge, no waiting-time surcharge, no driver-tip prompt. Prices are quoted in your selected currency; payment settles in AED at your bank's exchange rate.",
  },
  {
    question: "Do I need an account to book?",
    answer:
      "Yes, a free account is created at checkout with your name, email, and a password. No email verification needed before your transfer is confirmed. The account stores your booking history and passenger details so return trips are faster.",
  },
  {
    question: "How far in advance should I book?",
    answer:
      "24 hours is comfortable. Last-minute bookings under 3 hours are accepted on most routes and confirmed against live chauffeur availability. Same-day airport pickups are usually fine.",
  },
  {
    question: "What happens if my flight is delayed?",
    answer:
      "We track the flight number you provided and shift the pickup time automatically. The chauffeur waits up to 60 minutes past the rescheduled arrival at no extra charge. Extended waiting can be added at checkout.",
  },
  {
    question: "How do I find my driver at the airport?",
    answer:
      "Your chauffeur waits inside arrivals with a signed name placard and walks you to the vehicle. The driver's name and phone number appear on the confirmation page and again 30 minutes before pickup.",
  },
  {
    question: "Is the price per person or per vehicle?",
    answer:
      "Per vehicle. Up to the listed passenger and luggage capacity. Taxes and tolls are included in the quoted total.",
  },
]

export function FAQ() {
  const reduceMotion = useReducedMotion()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section
      aria-labelledby="faq-heading"
      className="editorial-section editorial-section--raised"
      id="faq"
    >
      <div className="luxury-container">
        <div className="editorial-split">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="editorial-eyebrow">Asked</div>
            <h2 id="faq-heading" className="editorial-section-title mt-5">
              Questions travellers actually ask.
            </h2>
            <p className="editorial-body mt-6">
              If yours isn&rsquo;t here, our team replies within an hour during local business hours.
            </p>
            <Link href="/contact" className="editorial-action mt-8">
              Write to support
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>

          <div className="editorial-split__rail border-t border-[var(--graphite)]">
            {faqData.map((faq, index) => {
              const isOpen = openIndex === index
              const triggerId = `faq-trigger-${index}`
              const contentId = `faq-content-${index}`

              return (
                <div
                  key={faq.question}
                  data-open={isOpen}
                  className="editorial-disclosure-row border-b border-[var(--graphite)]"
                >
                  {/* Reset the base-layer h3, whose clamp() size, -0.02em
                      tracking and 1.15 leading otherwise inherit into the row. */}
                  <h3 className="m-0 text-base font-normal leading-normal tracking-normal">
                    <button
                      id={triggerId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={contentId}
                      onClick={() => toggle(index)}
                      className="group flex w-full items-center justify-between gap-6 py-6 text-left transition-colors hover:text-[var(--gold-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-rich)]"
                    >
                      <span className="text-[1.125rem] font-medium leading-[1.35] text-[var(--text-primary)] group-hover:text-[var(--gold-text)]">
                        {faq.question}
                      </span>
                      <span
                        className="editorial-disclosure"
                        data-open={isOpen}
                        aria-hidden="true"
                      />
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={contentId}
                        role="region"
                        aria-labelledby={triggerId}
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
                        exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="pb-6 pr-10">
                          <p className="text-[0.9375rem] leading-relaxed text-[var(--text-secondary)] max-w-[60ch]">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
