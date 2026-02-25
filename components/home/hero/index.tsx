"use client"
import { motion } from 'motion/react'
import Image from 'next/image'
import { AmbientBackground } from './ambient-background'
import { SearchForm } from './search-form'
import { Check } from 'lucide-react'

export function Hero({ todayDate }: { todayDate: string }) {
  const heroFeatures = [
    "Fixed Prices",
    "24/7 Service",
    "Flight Tracking"
  ]

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[var(--black-void)] pt-[100px]">
      {/* Background Image with Enhanced Overlays */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-mercedes-luxury-hotel.jpg"
          alt="Luxury Mercedes S-Class parked in front of upscale hotel"
          fill
          className="object-cover brightness-[0.3] saturate-[0.8]"
          priority
          sizes="100vw"
        />
        {/* Gradient overlay matching HTML design exactly */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 100%, rgba(198, 170, 136, 0.08) 0%, transparent 50%),
            linear-gradient(180deg, var(--black-void) 0%, transparent 30%, transparent 70%, var(--black-void) 100%),
            linear-gradient(90deg, var(--black-void) 0%, transparent 30%, transparent 70%, var(--black-void) 100%)
          `
        }}></div>
      </div>

      {/* Art Deco Corner Accents */}
      <div className="art-deco-corner art-deco-corner--tl hidden lg:block"></div>
      <div className="art-deco-corner art-deco-corner--br hidden lg:block"></div>

      {/* Ambient Animations */}
      <AmbientBackground />

      {/* Content - Two Column Layout */}
      <div className="relative z-10 luxury-container pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-[var(--space-4xl)] items-center">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-left"
          >
            {/* Eyebrow */}
            <div className="hero-eyebrow">
              Luxury Transportation
            </div>

            {/* Title */}
            <h1 className="hero-title">
              Premier <em>Transfers</em><br />
              from Airport or City
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle max-w-lg">
              Experience unparalleled comfort and style with our premium chauffeur service.
              Where every journey becomes an occasion.
            </p>

            {/* Feature List */}
            <div className="hero-features flex-wrap">
              {heroFeatures.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  className="hero-feature"
                >
                  <span className="hero-feature-icon">
                    <Check className="w-3 h-3 text-[var(--gold)]" />
                  </span>
                  {feature}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Booking Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:justify-self-end w-full max-w-md"
          >
            <SearchForm todayDate={todayDate} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
