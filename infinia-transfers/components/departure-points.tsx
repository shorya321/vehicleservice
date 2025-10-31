"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MapPin, Plane } from "lucide-react"

const departureData = [
  { name: "Dubai International Airport", popular: true, destinations: 149, rides: "1000+", icon: Plane },
  { name: "Marina District Dubai", popular: true, destinations: 70, rides: "500+", icon: MapPin },
  { name: "Abu Dhabi", popular: false, destinations: 77, rides: "500+", icon: MapPin },
  { name: "Abu Dhabi International Airport", popular: true, destinations: 138, rides: "500+", icon: Plane },
  { name: "Palm Jumeirah", popular: false, destinations: 35, rides: "250+", icon: MapPin },
  { name: "Downtown Dubai", popular: true, destinations: 63, rides: "250+", icon: MapPin },
]

export function DeparturePoints() {
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
          <h2 className="section-title">Departure Points</h2>
          <div className="section-divider"></div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {departureData.map((point, index) => (
            <motion.div
              key={point.name}
              className="luxury-card luxury-card-hover flex flex-col p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="flex items-center mb-3">
                <point.icon className="w-5 h-5 text-luxury-gold mr-3 flex-shrink-0" />
                <h3 className="text-lg font-serif text-luxury-pearl flex-1">{point.name}</h3>
              </div>
              <div className="flex space-x-3 text-xs text-luxury-lightGray/80 mb-5">
                {point.popular && (
                  <span className="bg-luxury-gold/10 text-luxury-gold px-2 py-0.5 rounded-full font-semibold">
                    Popular
                  </span>
                )}
                <span>{point.destinations} destinations</span>
                <span>{point.rides} rides</span>
              </div>
              <Button variant="subtle" size="default" className="w-full mt-auto">
                Choose
              </Button>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <Button variant="outline" size="lg">
            All Points
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
