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
    <div className="section-padding">
      <div className="luxury-container">
        <motion.div
          className="section-title-wrapper"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Our Partners</h2>
          <div className="section-divider"></div>
          <p className="section-subtitle">
            Trusted by leading airlines, hotels, and tourism organizations across the UAE
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {partnersData.map((partner, index) => (
            <motion.div
              key={partner.name}
              className="luxury-card luxury-card-hover flex items-center justify-center p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="relative w-full h-12 grayscale hover:grayscale-0 transition-all duration-300">
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
    </div>
  )
}
