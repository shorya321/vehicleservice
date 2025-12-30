"use client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import Link from "next/link"

const faqData = [
  {
    question: "How do I book a transfer?",
    answer:
      "Enter the departure and destination in the booking form. Specify the exact address. Select your transfer class and click 'Search' to see available options and prices. Finalize your booking in a few simple steps.",
  },
  {
    question: "How far in advance should I book?",
    answer:
      "We recommend booking at least 24 hours in advance to ensure availability. However, we strive to accommodate last-minute requests whenever possible.",
  },
  {
    question: "What if my flight is delayed?",
    answer:
      "We monitor flight statuses. Your chauffeur will adjust the pickup time accordingly. Please provide your flight number during booking for this complimentary service.",
  },
  {
    question: "How do I find my driver?",
    answer:
      "Your driver will meet you in the arrivals hall with a sign bearing your name. Detailed meeting instructions will be in your booking confirmation email.",
  },
  {
    question: "Is the price per person or per vehicle?",
    answer:
      "The price is always per vehicle, not per person. The final price you see is the total for the selected vehicle and route, inclusive of all taxes and fees.",
  },
]

export function FAQ() {
  return (
    <section className="section-padding faq-section" id="faq">
      <div className="luxury-container">
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-16">
          {/* Left Column - Intro */}
          <motion.div
            className=""
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <span className="section-eyebrow mb-4 block">Need Help?</span>
            <h2 className="font-display text-3xl md:text-4xl text-[var(--text-primary)] mb-6">
              Your Premium Transfer Experience
            </h2>
            <div className="w-16 h-px bg-[var(--gold)] mb-6"></div>
            <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
              <p>
                From the dazzling heights of Dubai to the cultural heart of Abu Dhabi, navigating the UAE requires
                comfort, reliability, and a touch of class.
              </p>
              <p>
                With our premier service, you bypass the uncertainties of local transport. Your professional chauffeur,
                pre-booked vehicle, and fixed-price journey ensure a seamless experience from start to finish.
              </p>
            </div>
            <Link href="#contact" className="btn btn-secondary mt-6">
              Contact Support
            </Link>
          </motion.div>

          {/* Right Column - FAQ */}
          <motion.div
            className=""
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h3 className="font-display text-2xl text-[var(--text-primary)] mb-8">
              Frequently Asked Questions
            </h3>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqData.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="faq-item group"
                >
                  <AccordionTrigger className="faq-trigger">
                    <span className="font-body font-medium text-left pr-4">{faq.question}</span>
                    <Plus className="faq-icon" aria-hidden="true" />
                  </AccordionTrigger>
                  <AccordionContent className="px-8 pb-5 pt-0">
                    <p className="text-[var(--text-secondary)] leading-[1.7] text-sm">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
