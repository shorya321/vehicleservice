'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

const faqs = [
  {
    question: 'How do I book a transfer?',
    answer:
      'You can book a transfer through our website by selecting your pickup and drop-off locations, choosing your preferred vehicle class, and completing the booking form. Alternatively, contact our concierge team directly via phone or email for personalized assistance.',
  },
  {
    question: 'What is your cancellation policy?',
    answer:
      'We offer free cancellation up to 24 hours before your scheduled pickup. Cancellations made within 24 hours may be subject to a cancellation fee. For airport transfers, we recommend booking at least 48 hours in advance.',
  },
  {
    question: 'Do you offer corporate accounts?',
    answer:
      'Yes, we offer tailored corporate accounts with dedicated account management, priority booking, monthly invoicing, and volume-based pricing. Contact us via the "Corporate Services" option in the form above to learn more.',
  },
  {
    question: 'What areas do you serve?',
    answer:
      'We provide luxury transfer services across the UAE and select international cities. Core coverage includes Dubai, Abu Dhabi, Sharjah, and their airports, hotels, and business districts. Cross-emirate and intercity transfers are available on all routes.',
  },
]

export function ContactFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="faq-board">
      <div>
        <div className="editorial-eyebrow editorial-eyebrow--pill faq-board__eyebrow"><i aria-hidden="true" />Asked</div>
        <h2 id="contact-faq-heading" className="editorial-section-title mt-5">
          Questions travellers actually ask.
        </h2>
        <p className="faq-board__body mt-[1.125rem]">
          If none of these covers it, the form above reaches the same team. They reply within
          an hour during Dubai business hours.
        </p>
        <a href="#contact-form" className="btn btn-secondary faq-board__support">
          Write to the desk
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      <div className="faq-board__list">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          const triggerId = `faq-trigger-${index}`
          const answerId = `faq-answer-${index}`

          return (
            <div key={faq.question} className="faq-card" data-open={isOpen}>
              <h3 className="m-0 text-base font-normal leading-normal tracking-normal">
                <button
                  id={triggerId}
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="faq-card__q"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                >
                  {faq.question}
                  <span className="faq-card__marker" aria-hidden="true" />
                </button>
              </h3>
              <div
                id={answerId}
                role="region"
                aria-labelledby={triggerId}
                inert={!isOpen}
                className="faq-card__a"
              >
                <div>
                  <p>{faq.answer}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
