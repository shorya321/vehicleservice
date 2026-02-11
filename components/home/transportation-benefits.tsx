"use client"
import { motion } from "motion/react"
import { Sparkles, ConciergeBell, ShieldCheck } from "lucide-react"
import Image from "next/image"

const benefitsData = [
  {
    icon: Sparkles,
    title: "Easy Booking",
    description: "Book your ride in just a few clicks! We'll handle the rest to ensure a flawless travel experience.",
    image: "/benefits/easy-booking-process.jpg",
  },
  {
    icon: ConciergeBell,
    title: "Seamless Meet & Greet",
    description: "Meet your driver effortlessly. We'll guide you to your chauffeur from the moment you land.",
    image: "/benefits/meet-and-greet.jpg",
  },
  {
    icon: ShieldCheck,
    title: "Relaxed and Safe Ride",
    description: "Sit back, relax and enjoy the view from the comfort of your ride, leaving the hustle behind.",
    image: "/benefits/relaxed-safe-ride.jpg",
  },
]

export function TransportationBenefits() {
  return (
    <section className="section-padding benefits-section">
      <div className="luxury-container">
        {/* Section Header */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <span className="section-eyebrow">Our Promise</span>
          <h2 className="section-title">Transportation Beyond Expectations</h2>
          <div className="section-divider">
            <div className="section-divider-icon"></div>
          </div>
          <p className="section-subtitle">
            Relax and enjoy the ride, knowing that every detail is managed for your peace of mind.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {benefitsData.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              className="benefit-card group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true, amount: 0.2 }}
            >
              {/* Image Container */}
              <div className="relative w-full aspect-[4/5] overflow-hidden">
                <Image
                  src={benefit.image || "/placeholder.svg"}
                  alt={benefit.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Multi-layer gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--black-void)] via-[var(--black-void)]/60 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[var(--gold)]/5"></div>

              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-6">
                {/* Icon above title */}
                <div className="benefit-icon">
                  <benefit.icon className="w-5 h-5 text-[var(--gold)]" aria-hidden="true" />
                </div>
                <h3 className="font-display text-xl lg:text-2xl text-[var(--text-primary)] mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
