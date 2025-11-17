"use client"
import { motion } from "framer-motion"
import Link from 'next/link'
import { Instagram, Linkedin, Facebook, Twitter, Youtube, ChevronRight } from "lucide-react"

const footerLinkCategories = [
  {
    title: "Main",
    links: [
      { name: "Home", href: "/" },
      { name: "FAQ", href: "#faq" },
      { name: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { name: "Transfer Services", href: "/search" },
      { name: "Chauffeur Hire", href: "#" },
    ],
  },
  {
    title: "Business",
    links: [
      { name: "Corporate Clients", href: "#" },
      { name: "API Solutions", href: "#" },
    ],
  },
  {
    title: "Partners",
    links: [{ name: "For Vendors", href: "/customer/apply-vendor" }],
  },
]

const socialMediaLinks = [
  { icon: Instagram, href: "#", name: "Instagram" },
  { icon: Linkedin, href: "#", name: "LinkedIn" },
  { icon: Facebook, href: "#", name: "Facebook" },
  { icon: Twitter, href: "#", name: "Twitter" },
  { icon: Youtube, href: "#", name: "Youtube" },
]

export function Footer() {
  return (
    <footer className="bg-luxury-black border-t border-luxury-gold/10">
      <div className="section-padding pb-12">
        <div className="luxury-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            <motion.div
              className="sm:col-span-2 lg:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-serif text-luxury-pearl mb-4">VehicleService</h3>
              <a
                href="mailto:support@vehicleservice.com"
                className="block text-sm text-luxury-gold hover:underline mb-2"
              >
                support@vehicleservice.com
              </a>
              <p className="text-sm text-luxury-lightGray/80">We are available 24/7</p>
            </motion.div>

            {footerLinkCategories.map((category, catIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: (catIndex + 1) * 0.05, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                <h4 className="font-sans text-base font-semibold text-luxury-pearl mb-4">{category.title}</h4>
                <ul className="space-y-2">
                  {category.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-luxury-lightGray/80 hover:text-luxury-gold transition-colors flex items-center"
                      >
                        <ChevronRight className="w-4 h-4 mr-1 text-luxury-gold/50" /> {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="border-t border-luxury-gold/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <p className="text-xs text-luxury-lightGray/60 text-center md:text-left">
              © {new Date().getFullYear()} VehicleService. All Rights Reserved.
            </p>
            <div className="flex space-x-4">
              {socialMediaLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-luxury-lightGray/70 hover:text-luxury-gold transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}