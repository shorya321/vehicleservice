"use client"
import { motion } from "framer-motion"
import Image from "next/image"

const partnerLogos = [
  {
    name: "Mezio",
    src: "https://images.unsplash.com/photo-1611162616805-6a406b283633?w=500&h=200&fit=crop",
    alt: "Partner Logo 1",
  },
  {
    name: "Trip.com",
    src: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&h=200&fit=crop",
    alt: "Partner Logo 2",
  },
  {
    name: "Rate Hawk",
    src: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=500&h=200&fit=crop",
    alt: "Partner Logo 3",
  },
  {
    name: "Hertz",
    src: "https://images.unsplash.com/photo-1611162617463-39a2ec055f4b?w=500&h=200&fit=crop",
    alt: "Partner Logo 4",
  },
  {
    name: "HQ",
    src: "https://images.unsplash.com/photo-1611162616834-3b3a9c055f4b?w=500&h=200&fit=crop",
    alt: "Partner Logo 5",
  },
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
          <p className="section-subtitle">Leading companies trust us with their most valuable asset: their clients.</p>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center items-center gap-x-10 gap-y-8 md:gap-x-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          {partnerLogos.map((logo, index) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <Image
                src={logo.src || "/placeholder.svg"}
                alt={logo.alt}
                width={130}
                height={50}
                className="object-contain filter grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
