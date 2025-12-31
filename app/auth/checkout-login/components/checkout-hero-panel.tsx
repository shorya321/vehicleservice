'use client'

import { motion } from 'framer-motion'
import { Calendar, Users, Shield, Lock, CheckCircle, ArrowRight } from 'lucide-react'

export function CheckoutHeroPanel() {
  return (
    <aside className="checkout-hero-panel">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070')",
            filter: 'brightness(0.35) saturate(0.8)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-luxury-void via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-void via-transparent to-luxury-void opacity-80" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-luxury-void to-transparent" />
      </div>

      {/* Art Deco Corner Accents */}
      <div className="hero-corner hero-corner--tl" />
      <div className="hero-corner hero-corner--br" />

      {/* Hero Content */}
      <div className="relative z-10 p-16 flex flex-col gap-16">
        {/* Hero Text */}
        <motion.div
          className="max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-8 bg-luxury-gold" />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-luxury-gold">
              Secure Checkout
            </span>
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl font-light leading-[1.1] mb-6 text-luxury-pearl">
            Complete Your<br />
            <em className="text-luxury-gold italic">Journey</em>
          </h1>
          <p className="text-luxury-textSecondary text-lg leading-relaxed">
            You're just one step away from booking your premium transfer.
            Sign in or create an account to continue.
          </p>
        </motion.div>

        {/* Booking Summary Card */}
        <motion.div
          className="booking-summary-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-luxury-gold/10">
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-luxury-gold">
              Your Booking
            </span>
            <a
              href="/"
              className="text-xs text-luxury-textMuted hover:text-luxury-gold transition-colors"
            >
              Edit Search
            </a>
          </div>

          {/* Route Display */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="text-[10px] font-medium tracking-[0.1em] uppercase text-luxury-textMuted mb-1">
                Pick-up
              </div>
              <div className="font-serif text-lg text-luxury-pearl">Airport Terminal</div>
            </div>
            <div className="w-10 h-10 rounded-full border border-luxury-gold/20 bg-luxury-gold/10 flex items-center justify-center flex-shrink-0">
              <ArrowRight className="w-4 h-4 text-luxury-gold" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-medium tracking-[0.1em] uppercase text-luxury-textMuted mb-1">
                Drop-off
              </div>
              <div className="font-serif text-lg text-luxury-pearl">Hotel Downtown</div>
            </div>
          </div>

          {/* Booking Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-luxury-gold/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-luxury-gold" />
              </div>
              <div>
                <div className="text-[10px] font-medium tracking-[0.1em] uppercase text-luxury-textMuted">Date</div>
                <div className="text-sm text-luxury-pearl">Dec 31, 2025</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-luxury-gold/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-luxury-gold" />
              </div>
              <div>
                <div className="text-[10px] font-medium tracking-[0.1em] uppercase text-luxury-textMuted">Passengers</div>
                <div className="text-sm text-luxury-pearl">2 passengers</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          className="flex flex-wrap gap-8 mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 text-sm text-luxury-textSecondary">
            <Shield className="w-4 h-4 text-luxury-gold" />
            <span>Secure Payments</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-luxury-textSecondary">
            <Lock className="w-4 h-4 text-luxury-gold" />
            <span>Data Protected</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-luxury-textSecondary">
            <CheckCircle className="w-4 h-4 text-luxury-gold" />
            <span>Verified Service</span>
          </div>
        </motion.div>
      </div>
    </aside>
  )
}
