"use client"
import { motion } from "framer-motion"
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
    <div className="section-padding">
      <div className="luxury-container">
        <motion.div
          className="section-title-wrapper"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Transportation Beyond Expectations</h2>
          <div className="section-divider"></div>
          <p className="section-subtitle">
            Relax and enjoy the ride, knowing that every detail is managed for your peace of mind.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefitsData.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              className="group relative overflow-hidden rounded-lg shadow-xl luxury-card luxury-card-hover"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src={benefit.image || "/placeholder.svg"}
                  alt={benefit.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Enhanced overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-black/95 via-luxury-black/60 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 p-6 md:p-8 text-luxury-pearl w-full">
                <div className="flex items-center mb-3">
                  <div className="p-3 bg-luxury-gold rounded-lg mr-4 shadow-md" aria-hidden="true">
                    <benefit.icon className="w-6 h-6 text-luxury-black" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-serif text-luxury-pearl">{benefit.title}</h3>
                </div>
                <p className="text-sm text-luxury-pearl/80 leading-relaxed">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
