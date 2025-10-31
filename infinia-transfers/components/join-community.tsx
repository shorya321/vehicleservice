"use client"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Mail } from "lucide-react"

export function JoinCommunity() {
  return (
    <div className="section-padding">
      <div className="luxury-container">
        <div className="luxury-card overflow-hidden">
          <div className="grid md:grid-cols-2 items-center">
            <motion.div
              className="p-8 md:p-12"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.5 }}
            >
              <h2 className="text-3xl lg:text-4xl text-luxury-pearl mb-3">Join Our Community</h2>
              <div className="h-1 w-20 bg-luxury-gold rounded-full mb-6"></div>
              <p className="text-luxury-lightGray mb-6 text-lg">
                Exclusive offers and insider travel tips delivered to your inbox.
              </p>
              <form className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-gold/70" />
                  <Input
                    type="email"
                    placeholder="Your Email Address"
                    className="w-full h-12 bg-luxury-gray/50 border-luxury-gray hover:border-luxury-gold/40 focus:border-luxury-gold/40 pl-12"
                  />
                </div>
                <Button type="submit" size="default" className="flex-shrink-0">
                  Subscribe
                </Button>
              </form>
              <p className="text-xs text-luxury-lightGray/70 mt-4">
                By subscribing, you agree to our{" "}
                <a href="/privacy" className="underline hover:text-luxury-gold">
                  Privacy Policy
                </a>
                .
              </p>
            </motion.div>
            <motion.div
              className="hidden md:block relative w-full h-full min-h-[400px]"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.5 }}
            >
              <Image
                src="https://images.unsplash.com/photo-1522199710521-72d69614c702?q=80&w=2072&auto=format&fit=crop"
                alt="Luxury travel imagery"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
