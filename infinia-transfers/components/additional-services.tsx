"use client"
import { motion } from "framer-motion"
import Image from "next/image"
import { Clock, Baby, GlassWater } from "lucide-react" // Changed Wifi to GlassWater for better refreshment icon

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
      "Stay connected and refreshed. Enjoy complimentary Wi-Fi and bottled water or soft drinks during your journey.", // Slightly updated description
    image: "/services/in-car-refreshments.jpg", // Updated image path
    icon: GlassWater, // Changed icon to better represent refreshments
  },
]

export function AdditionalServices() {
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
          <h2 className="section-title">Additional Services</h2>
          <div className="section-divider"></div>
          <p className="section-subtitle">
            Customize your ride to suit all your needs with our range of optional extras.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {additionalServicesData.map((service, index) => (
            <motion.div
              key={service.title}
              className="luxury-card luxury-card-hover flex flex-col overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="relative w-full h-56">
                <Image
                  src={service.image || "/placeholder.svg?width=400&height=224&query=luxury+service"}
                  alt={service.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-luxury-gold/10 rounded-md mr-3">
                    <service.icon className="w-5 h-5 text-luxury-gold" />
                  </div>
                  <h3 className="text-xl font-serif text-luxury-pearl">{service.title}</h3>
                </div>
                <p className="text-sm text-luxury-lightGray/90 flex-grow mb-4">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
