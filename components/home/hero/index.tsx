"use client"
import { motion } from 'framer-motion'
import Image from 'next/image'
import { AmbientBackground } from './ambient-background'
import { SearchForm } from './search-form'

export function Hero() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-luxury-black">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-mercedes-luxury-hotel.jpg"
          alt="Luxury Mercedes S-Class parked in front of upscale hotel"
          fill
          className="object-cover opacity-50"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent"></div>
      </div>

      {/* Ambient Animations */}
      <AmbientBackground />

      {/* Content */}
      <div className="relative z-10 luxury-container flex flex-col justify-center items-center text-center flex-grow pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="w-full max-w-4xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl mb-4 leading-tight font-serif text-luxury-pearl">
            Premier Transfers from Airport or City
          </h1>
          <p className="text-base md:text-lg mb-12 text-luxury-gold">
            Professional Service • Fixed Prices • 24/7 Support
          </p>
        </motion.div>

        <SearchForm />
      </div>
    </div>
  )
}
