"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Users, Luggage } from "lucide-react"
import Image from "next/image"

const carClassesData = {
  Economy: [
    {
      name: "Economy",
      passengers: 4,
      luggage: 2,
      image: "https://images.unsplash.com/photo-1616422285623-13ff0162193c?q=80&w=2070&auto=format&fit=crop",
      models: "Toyota Corolla, Hyundai Elantra",
    },
    {
      name: "Comfort",
      passengers: 4,
      luggage: 3,
      image: "https://images.unsplash.com/photo-1617469747579-9f249228f7a2?q=80&w=2070&auto=format&fit=crop",
      models: "Toyota Camry, VW Passat",
    },
  ],
  Business: [
    {
      name: "Business",
      passengers: 3,
      luggage: 2,
      image: "https://images.unsplash.com/photo-1617558246353-9c69a65035a8?q=80&w=2070&auto=format&fit=crop",
      models: "Mercedes E-Class, BMW 5 Series",
    },
    {
      name: "First Class",
      passengers: 3,
      luggage: 2,
      image: "https://images.unsplash.com/photo-1626061994638-f45386645b39?q=80&w=2070&auto=format&fit=crop",
      models: "Mercedes S-Class, BMW 7 Series",
    },
  ],
  Minibus: [
    {
      name: "Minivan 4PAX",
      passengers: 4,
      luggage: 4,
      image: "https://images.unsplash.com/photo-1605470295900-7a335a75101a?q=80&w=2070&auto=format&fit=crop",
      models: "Honda Odyssey, Kia Carnival",
    },
    {
      name: "Minibus 7PAX",
      passengers: 7,
      luggage: 6,
      image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto=format&fit=crop",
      models: "Mercedes V-Class, Hyundai Staria",
    },
  ],
  SUV: [
    {
      name: "Premium SUV",
      passengers: 4,
      luggage: 4,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop",
      models: "Range Rover, Cadillac Escalade",
    },
  ],
}

type CarClassCategory = keyof typeof carClassesData

export function CarClasses() {
  const [activeTab, setActiveTab] = useState<CarClassCategory>("Economy")
  const tabs: CarClassCategory[] = ["Economy", "Business", "Minibus", "SUV"]

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
          <h2 className="section-title">Car Classes</h2>
          <div className="section-divider"></div>
          <p className="section-subtitle">
            Solo or group transfer? Choose your perfect fit from our diverse range of vehicles.
          </p>
        </motion.div>

        <motion.div
          className="mb-10 flex justify-center flex-wrap gap-2"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              onClick={() => setActiveTab(tab)}
              size="default"
            >
              {tab}
            </Button>
          ))}
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {carClassesData[activeTab].map((vehicle, index) => (
            <motion.div
              key={vehicle.name}
              className="luxury-card luxury-card-hover flex flex-col p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            >
              <div className="relative w-full aspect-video mb-5 rounded-md overflow-hidden">
                <Image
                  src={vehicle.image || "/placeholder.svg"}
                  alt={vehicle.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                />
              </div>
              <h3 className="text-xl font-serif text-luxury-pearl mb-1">{vehicle.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-luxury-lightGray mb-3">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1.5 text-luxury-gold/70" /> {vehicle.passengers}
                </span>
                <span className="flex items-center">
                  <Luggage className="w-4 h-4 mr-1.5 text-luxury-gold/70" /> {vehicle.luggage}
                </span>
              </div>
              <p className="text-xs text-luxury-lightGray/70 mb-5 flex-grow">E.g., {vehicle.models}</p>
              <Button variant="default" size="default" className="w-full mt-auto">
                Select Vehicle
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
