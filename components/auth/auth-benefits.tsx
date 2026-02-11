"use client"

import { motion } from "motion/react"
import { Save, Clock, Gift, HelpCircle } from "lucide-react"
import Link from "next/link"

const benefits = [
  {
    icon: Save,
    title: "Save Your Details",
    description: "Your information will be saved for faster checkout next time"
  },
  {
    icon: Clock,
    title: "Track Bookings",
    description: "View and manage all your bookings in one place"
  },
  {
    icon: Gift,
    title: "Exclusive Offers",
    description: "Get access to member-only deals and discounts"
  }
]

export function AuthBenefits() {
  return (
    <div className="mt-8">
      {/* Benefits Card */}
      <motion.div
        className="benefits-card bg-gradient-to-br from-[rgba(22,21,20,0.8)] to-[rgba(15,14,13,0.9)] border border-[rgba(198,170,136,0.12)] rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Benefits Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[rgba(198,170,136,0.08)] to-transparent border-b border-[rgba(198,170,136,0.1)]">
          <h3 className="font-serif text-xl font-normal text-[var(--text-primary)]">
            Why Create an Account?
          </h3>
        </div>

        {/* Benefits List */}
        <div className="p-6 flex flex-col gap-5">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex gap-4">
              <div className="w-9 h-9 flex items-center justify-center bg-[rgba(198,170,136,0.1)] border border-[rgba(198,170,136,0.15)] rounded-lg flex-shrink-0">
                <benefit.icon className="w-[18px] h-[18px] stroke-[var(--gold)]" />
              </div>
              <div>
                <h4 className="font-sans text-[0.9375rem] font-medium text-[var(--text-primary)] mb-0.5">
                  {benefit.title}
                </h4>
                <p className="text-[0.8125rem] text-[var(--text-muted)] leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Help Section */}
      <motion.div
        className="mt-4 p-4 bg-[rgba(42,40,38,0.3)] border border-[rgba(198,170,136,0.1)] rounded-xl flex items-center gap-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-9 h-9 flex items-center justify-center bg-[rgba(198,170,136,0.1)] rounded-full flex-shrink-0">
          <HelpCircle className="w-[18px] h-[18px] stroke-[var(--gold)]" />
        </div>
        <div>
          <p className="text-[0.8125rem] text-[var(--text-muted)] mb-0.5">
            Having trouble with your account?
          </p>
          <Link
            href="/contact"
            className="text-[0.8125rem] text-[var(--gold)] font-medium hover:text-[var(--gold-light)] transition-colors"
          >
            Contact Support &rarr;
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
