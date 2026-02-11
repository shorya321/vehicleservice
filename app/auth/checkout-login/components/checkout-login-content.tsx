'use client'

import { Suspense } from 'react'
import { motion } from 'motion/react'
import { BookmarkCheck, History, Gift, HelpCircle } from 'lucide-react'
import { CheckoutAuthForm } from './checkout-auth-form'
import { CheckoutHeroPanel } from './checkout-hero-panel'

interface CheckoutLoginContentProps {
  returnUrl: string
}

export function CheckoutLoginContent({ returnUrl }: CheckoutLoginContentProps) {
  return (
    <div className="checkout-split-screen">
      {/* Left Panel Spacer - maintains grid space for fixed hero */}
      <div className="hidden lg:block" aria-hidden="true" />

      {/* Fixed Hero Panel (Desktop Only) */}
      <CheckoutHeroPanel />

      {/* Right Panel - Auth Form */}
      <section className="relative flex flex-col items-center px-6 py-12 md:px-12">
        {/* Ambient Glow */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl pointer-events-none"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="w-full max-w-lg relative z-10">
          {/* Page Header */}
          <motion.header
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-serif text-4xl md:text-5xl font-light mb-4 text-luxury-pearl">
              Secure <span className="gold-text">Checkout</span>
            </h1>
            <p className="text-luxury-textSecondary text-lg max-w-md mx-auto">
              Log in to your account or create one to continue with your booking
            </p>
            {/* Decorative Divider */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-luxury-gold to-transparent" />
              <div className="w-2 h-2 border border-luxury-gold rotate-45" />
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-luxury-gold to-transparent" />
            </div>
          </motion.header>

          {/* Auth Form */}
          <Suspense fallback={<div className="h-96 animate-pulse bg-luxury-charcoal/50 rounded-2xl" />}>
            <CheckoutAuthForm returnUrl={returnUrl} />
          </Suspense>

          {/* Benefits Section */}
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="luxury-card rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-br from-luxury-gold/10 to-transparent p-5 border-b border-luxury-gold/10">
                <h3 className="font-serif text-xl text-luxury-pearl">Why Create an Account?</h3>
              </div>
              <div className="p-6 space-y-5">
                {[
                  {
                    icon: BookmarkCheck,
                    title: "Save Your Details",
                    desc: "Your information will be saved for faster checkout next time"
                  },
                  {
                    icon: History,
                    title: "Track Bookings",
                    desc: "View and manage all your bookings in one place"
                  },
                  {
                    icon: Gift,
                    title: "Exclusive Offers",
                    desc: "Get access to member-only deals and discounts"
                  }
                ].map((benefit, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-9 h-9 rounded-lg bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-4 h-4 text-luxury-gold" />
                    </div>
                    <div>
                      <h4 className="font-medium text-luxury-pearl mb-1">{benefit.title}</h4>
                      <p className="text-sm text-luxury-textMuted leading-relaxed">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-4 p-5 rounded-xl bg-luxury-graphite/30 border border-luxury-gold/10 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-luxury-gold/10 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-4 h-4 text-luxury-gold" />
              </div>
              <div>
                <p className="text-sm text-luxury-textMuted mb-1">
                  Having trouble logging in or creating an account?
                </p>
                <a
                  href="/contact"
                  className="text-sm text-luxury-gold hover:text-luxury-goldLight font-medium transition-colors"
                >
                  Contact Support &rarr;
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
