"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Phone, UserCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Adjusted nav items based on KiwiTaxi, simplified for luxury theme
  const navItems = [
    { name: "Services", href: "#services" },
    { name: "Fleet", href: "#fleet" }, // Maps to Car Classes
    { name: "FAQ", href: "#faq" },
    { name: "Contact", href: "#contact" },
  ]

  return (
    <motion.header
      initial={{ y: -120 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 20, duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 
        ${isScrolled ? "bg-luxury-black/80 backdrop-blur-md shadow-xl border-b border-luxury-gold/10" : "bg-transparent"}`}
    >
      <div className="luxury-container">
        <div className="flex items-center justify-between h-20 md:h-24">
          <Link href="/" className="text-3xl font-serif text-luxury-pearl hover:text-luxury-gold transition-colors">
            Infinia
          </Link>

          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-luxury-lightGray hover:text-luxury-gold transition-colors duration-200 font-sans text-[13px] uppercase tracking-wider relative group"
              >
                {item.name}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-luxury-gold transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {/* Simplified: Phone and Account/Login */}
            <a
              href="tel:+971501234567" // Example number
              className="hidden md:flex items-center space-x-2 text-luxury-lightGray hover:text-luxury-gold transition-colors"
            >
              <Phone className="w-4 h-4 text-luxury-gold" />
              <span className="font-sans text-sm">+971 50 123 4567</span>
            </a>
            <Button variant="outline" size="sm" className="hidden lg:inline-flex items-center">
              <UserCircle className="w-4 h-4 mr-2" />
              Login
            </Button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-luxury-pearl p-2 focus:outline-none focus:ring-2 focus:ring-luxury-gold/50 rounded-md"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-luxury-black/95 backdrop-blur-lg border-t border-luxury-gold/10"
          >
            <div className="luxury-container py-5 flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-luxury-pearl hover:bg-luxury-gold/10 block text-center hover:text-luxury-gold transition-colors duration-200 font-sans py-3 text-sm uppercase tracking-wider rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 mt-2 border-t border-luxury-gold/10 flex flex-col space-y-3">
                <a
                  href="tel:+971501234567"
                  className="flex items-center justify-center space-x-2 text-luxury-pearl hover:text-luxury-gold transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Phone className="w-5 h-5 text-luxury-gold" />
                  <span>Call Us</span>
                </a>
                <Button variant="default" size="default" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
