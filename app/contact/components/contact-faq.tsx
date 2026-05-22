'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

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
      'We provide luxury transfer services across the UAE, covering Dubai, Abu Dhabi, Sharjah, and all major airports, hotels, and business districts. Cross-emirate and intercity transfers are available upon request.',
  },
]

export function ContactFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="divide-y divide-[var(--graphite)]">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div key={faq.question}>
              <button
                id={`faq-trigger-${index}`}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between py-5 text-left group rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="text-[0.9375rem] font-medium text-[var(--text-primary)] pr-4 group-hover:text-[var(--gold-text-hover)] transition-colors duration-200">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-trigger-${index}`}
                aria-hidden={!isOpen}
                className="grid transition-[grid-template-rows,opacity] duration-200"
                style={{
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div className="overflow-hidden">
                  <p className="pb-5 text-[0.9375rem] leading-[1.7] tracking-[0.01em] text-[var(--text-secondary)] max-w-[65ch] [text-wrap:pretty]">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
