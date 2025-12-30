"use client"
import { motion } from "framer-motion"
import Image from "next/image"

const partnersData = [
  { name: "Emirates", logo: "/partners/placeholder-logo.svg" },
  { name: "Etihad", logo: "/partners/placeholder-logo.svg" },
  { name: "Dubai Tourism", logo: "/partners/placeholder-logo.svg" },
  { name: "Hilton", logo: "/partners/placeholder-logo.svg" },
  { name: "Marriott", logo: "/partners/placeholder-logo.svg" },
  { name: "Four Seasons", logo: "/partners/placeholder-logo.svg" },
]

export function OurPartners() {
  return (
    <section className="section-padding relative bg-[var(--charcoal)]">
      <div className="luxury-container">
        {/* Section Header */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <span className="section-eyebrow">Trusted By</span>
          <h2 className="section-title">Our Partners</h2>
          <div className="section-divider">
            <div className="section-divider-icon"></div>
          </div>
          <p className="section-subtitle">
            Trusted by leading airlines, hotels, and tourism organizations across the UAE
          </p>
        </motion.div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {partnersData.map((partner, index) => (
            <motion.div
              key={partner.name}
              className="partner-card group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="relative w-full h-12 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                <Image
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
