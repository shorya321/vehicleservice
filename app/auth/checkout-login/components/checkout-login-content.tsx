'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { BookmarkCheck, History, Gift, HelpCircle } from 'lucide-react'
import { CheckoutAuthForm } from './checkout-auth-form'

interface CheckoutLoginContentProps {
  returnUrl: string
}

export function CheckoutLoginContent({ returnUrl }: CheckoutLoginContentProps) {
  return (
    <div className="relative min-h-screen bg-luxury-black overflow-hidden">
      {/* Ambient Background Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl"
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
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              className="font-serif text-4xl md:text-5xl text-luxury-pearl mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              Secure Checkout
            </motion.h1>
            <motion.p
              className="text-luxury-lightGray text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Log in to your account or create one to continue with your booking
            </motion.p>
            <motion.div
              className="w-20 h-1 bg-luxury-gold rounded-full mx-auto mt-4"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
            />
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Auth Form - 3 columns */}
            <div className="lg:col-span-3">
              <Suspense fallback={<div>Loading...</div>}>
                <CheckoutAuthForm returnUrl={returnUrl} />
              </Suspense>
            </div>

            {/* Benefits - 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              <motion.div
                className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="bg-gradient-to-br from-luxury-gold/10 to-transparent p-6 border-b border-luxury-gold/20">
                  <h2 className="font-serif text-2xl md:text-3xl text-luxury-pearl">Why Create an Account?</h2>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    {
                      icon: BookmarkCheck,
                      title: "Save Your Details",
                      description: "Your information will be saved for faster checkout next time"
                    },
                    {
                      icon: History,
                      title: "Track Bookings",
                      description: "View and manage all your bookings in one place"
                    },
                    {
                      icon: Gift,
                      title: "Exclusive Offers",
                      description: "Get access to member-only deals and discounts"
                    }
                  ].map((benefit, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start space-x-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (index * 0.1) }}
                    >
                      <benefit.icon className="h-5 w-5 mt-0.5" style={{ color: "#C6AA88" }} aria-hidden="true" />
                      <div className="flex-1">
                        <h3 className="font-medium text-luxury-pearl mb-1">{benefit.title}</h3>
                        <p className="text-sm text-luxury-lightGray">{benefit.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex items-start space-x-3">
                  <HelpCircle className="h-5 w-5 mt-0.5" style={{ color: "#C6AA88" }} aria-hidden="true" />
                  <div className="flex-1">
                    <h3 className="font-medium text-luxury-pearl mb-2">Need Help?</h3>
                    <p className="text-sm text-luxury-lightGray mb-3">
                      Having trouble logging in or creating an account?
                    </p>
                    <a
                      href="/contact"
                      className="text-sm text-luxury-gold hover:text-luxury-gold/80 font-medium transition-colors"
                    >
                      Contact Support →
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
