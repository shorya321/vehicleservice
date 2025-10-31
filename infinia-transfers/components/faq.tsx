"use client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqData = [
  {
    question: "How do I book a transfer in UAE?",
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
    <div className="section-padding">
      <div className="luxury-container">
        <div className="grid lg:grid-cols-3 gap-12">
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-2xl lg:text-3xl text-luxury-pearl mb-3">Your Transfer in the UAE</h2>
            <div className="h-1 w-16 bg-luxury-gold rounded-full mb-5"></div>
            <div className="space-y-4 text-sm text-luxury-lightGray/90 leading-relaxed">
              <p>
                From the dazzling heights of Dubai to the cultural heart of Abu Dhabi, navigating the UAE requires
                comfort, reliability, and a touch of class.
              </p>
              <p>
                With Infinia Transfers, you bypass the uncertainties of local transport. Your professional chauffeur,
                pre-booked vehicle, and fixed-price journey ensure a seamless experience from start to finish.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-2xl lg:text-3xl text-luxury-pearl mb-3">Frequently Asked Questions</h2>
            <div className="h-1 w-16 bg-luxury-gold rounded-full mb-8"></div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqData.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="luxury-card border-none overflow-hidden group" // Added group here
                >
                  <AccordionTrigger className="p-6 text-left hover:no-underline text-base text-luxury-pearl w-full flex justify-between items-center data-[state=open]:text-luxury-gold">
                    <span className="font-sans font-semibold">{faq.question}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-luxury-gold/70 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180 group-hover:text-luxury-gold" />
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-0">
                    <p className="text-luxury-lightGray/90 leading-relaxed text-sm">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
