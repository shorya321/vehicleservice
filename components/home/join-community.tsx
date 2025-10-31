"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

const benefits = [
  "Exclusive member discounts on all rides",
  "Priority booking and customer support",
  "Earn points with every trip",
  "Early access to new vehicle classes",
]

export function JoinCommunity() {
  return (
    <div className="section-padding">
      <div className="luxury-container">
        <div className="luxury-card p-8 md:p-12 max-w-4xl mx-auto">
          <motion.div
            className="section-title-wrapper"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Join Our Community</h2>
            <div className="section-divider"></div>
            <p className="section-subtitle">
              Become a member and unlock exclusive benefits, rewards, and premium travel experiences
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-luxury-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-luxury-lightGray">{benefit}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <Button asChild size="lg">
              <Link href="/register">JOIN NOW</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/how-it-works">LEARN MORE</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
