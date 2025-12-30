"use client"
import { motion } from "framer-motion"
import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"

const benefits = [
  "Exclusive member discounts on all rides",
  "Priority booking and customer support",
  "Earn points with every trip",
  "Early access to new vehicle classes",
]

export function JoinCommunity() {
  return (
    <section className="section-padding cta-section">
      <div className="luxury-container">
        <motion.div
          className="cta-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          {/* Corner Decorations */}
          <div className="cta-corner cta-corner--tl"></div>
          <div className="cta-corner cta-corner--br"></div>

          {/* Content */}
          <div className="relative z-10 text-center">
            <span className="section-eyebrow">Membership</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[var(--text-primary)] mb-4">
              Join Our <span className="gold-text">Community</span>
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-10">
              Become a member and unlock exclusive benefits, rewards, and premium travel experiences
            </p>

            {/* Benefits Grid */}
            <motion.div
              className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 text-left"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="cta-feature-check">
                    <Check aria-hidden="true" />
                  </div>
                  <span className="text-[var(--text-secondary)] text-sm">{benefit}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
            >
              <Link href="/register" className="btn btn-primary btn-lg">
                Join Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/how-it-works" className="btn btn-secondary btn-lg">
                Learn More
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
