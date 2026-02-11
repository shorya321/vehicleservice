"use client"

import { motion } from "motion/react"
import { Save, Clock, Gift, Shield, Lock, CheckCircle } from "lucide-react"

const features = [
  {
    icon: Save,
    title: "Quick Booking",
    description: "Access saved details for faster checkout"
  },
  {
    icon: Clock,
    title: "Booking History",
    description: "View and manage all your transfers"
  },
  {
    icon: Gift,
    title: "Member Rewards",
    description: "Exclusive deals and loyalty benefits"
  }
]

const trustIndicators = [
  { icon: Shield, text: "Secure Login" },
  { icon: Lock, text: "Data Protected" },
  { icon: CheckCircle, text: "Verified Service" }
]

export function AuthHeroPanel() {
  return (
    <aside className="auth-hero-panel">
      {/* Background with image and gradient */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070')",
            filter: "brightness(0.35) saturate(0.8)"
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 80% at 50% 100%, rgba(198, 170, 136, 0.1) 0%, transparent 50%),
              linear-gradient(180deg, var(--black-void) 0%, transparent 20%, transparent 80%, var(--black-void) 100%),
              linear-gradient(90deg, var(--black-void) 0%, transparent 30%)
            `
          }}
        />
      </div>

      {/* Corner Accents */}
      <div className="hero-corner hero-corner--tl" />
      <div className="hero-corner hero-corner--br" />

      {/* Content */}
      <div className="relative z-10 p-16 flex flex-col gap-16">
        {/* Hero Text */}
        <motion.div
          className="max-w-[450px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-eyebrow">Welcome to Infinia</div>
          <h1 className="hero-title">
            Your Premium<br />
            <em>Journey Awaits</em>
          </h1>
          <p className="hero-subtitle">
            Sign in or create an account to access your bookings, manage your profile, and enjoy exclusive member benefits.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          className="flex flex-col gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {features.map((feature) => (
            <div key={feature.title} className="flex items-center gap-4">
              <div className="w-11 h-11 flex items-center justify-center bg-[rgba(198,170,136,0.1)] border border-[rgba(198,170,136,0.2)] rounded-xl flex-shrink-0">
                <feature.icon className="w-5 h-5 stroke-[var(--gold)]" />
              </div>
              <div>
                <h4 className="font-sans text-[0.9375rem] font-medium text-[var(--text-primary)] mb-1">
                  {feature.title}
                </h4>
                <p className="text-[0.8125rem] text-[var(--text-muted)]">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          className="flex gap-8 mt-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {trustIndicators.map((indicator) => (
            <div key={indicator.text} className="flex items-center gap-2 text-[0.8125rem] text-[var(--text-secondary)]">
              <indicator.icon className="w-[18px] h-[18px] stroke-[var(--gold)]" />
              <span>{indicator.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </aside>
  )
}
