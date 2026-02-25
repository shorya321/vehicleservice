'use client'

import { motion } from 'motion/react'
import { Users, Car, Star, MapPin } from 'lucide-react'

const stats = [
  { icon: Users, number: '15K+', label: 'Happy Clients' },
  { icon: Car, number: '50+', label: 'Premium Vehicles' },
  { icon: Star, number: '4.9', label: 'Average Rating' },
  { icon: MapPin, number: '200+', label: 'Routes Available' },
]

export function StatsRibbon() {
  return (
    <section className="stats-ribbon">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <motion.div
          className="stats-grid"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="stat-item"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="stat-icon">
                <stat.icon size={18} strokeWidth={1.5} />
              </div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
