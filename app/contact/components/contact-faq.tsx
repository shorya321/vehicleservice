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
    <div className="max-w-3xl mx-auto space-y-3">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index
        return (
          <div
            key={index}
            className="luxury-card overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <span className="text-sm font-medium text-[var(--text-primary)] pr-4">
                {faq.question}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[var(--gold)] shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className="overflow-hidden transition-all duration-300"
              style={{
                maxHeight: isOpen ? '200px' : '0',
                opacity: isOpen ? 1 : 0,
              }}
            >
              <p className="px-5 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
