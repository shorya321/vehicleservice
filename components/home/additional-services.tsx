"use client"
import { motion } from "motion/react"
import Image from "next/image"
import { Clock, Baby, Wifi } from "lucide-react"

const additionalServicesData = [
  {
    title: "Child Seats",
    description:
      "Safety first. We provide age-appropriate child seats: Infant (up to 10kg), Toddler (9-18kg), and Booster (15-36kg).",
    image: "/services/child-seat.jpg",
    icon: Baby,
  },
  {
    title: "Extra Hour of Waiting",
    description:
      "No rush. Your chauffeur will wait for you at the airport or your pickup point for an extended period if needed.",
    image: "/services/driver-waiting.jpg",
    icon: Clock,
  },
  {
    title: "In-Car Wi-Fi & Refreshments",
    description:
      "Stay connected and refreshed. Enjoy complimentary Wi-Fi and bottled water or soft drinks during your journey.",
    image: "/services/in-car-refreshments.jpg",
    icon: Wifi,
  },
]

export function AdditionalServices() {
  return (
    <section className="section-padding relative bg-[var(--black-void)]" id="services">
      <div className="luxury-container">
        {/* Section Header */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <span className="section-eyebrow">Extras</span>
          <h2 className="section-title">Additional Services</h2>
          <div className="section-divider">
            <div className="section-divider-icon"></div>
          </div>
          <p className="section-subtitle">
            Customize your ride to suit all your needs with our range of optional extras.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {additionalServicesData.map((service, index) => (
            <motion.div
              key={service.title}
              className="service-card group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true, amount: 0.3 }}
            >
              {/* Image */}
              <div className="relative w-full h-48 overflow-hidden">
                <Image
                  src={service.image || "/placeholder.svg"}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--charcoal)] via-transparent to-transparent"></div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Icon above title */}
                <div className="benefit-icon">
                  <service.icon className="w-5 h-5 text-[var(--gold)]" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg text-[var(--text-primary)] mb-2">{service.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
