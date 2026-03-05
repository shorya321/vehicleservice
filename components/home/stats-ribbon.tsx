'use client'

import { motion } from 'motion/react'
import { Users, Car, Star, MapPin } from 'lucide-react'

interface StatsRibbonProps {
  totalCustomers?: number
  totalVehicles?: number
  averageRating?: number
  totalRoutes?: number
}

const formatNumber = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K+`
  return `${n}+`
}

export function StatsRibbon({
  totalCustomers = 15000,
  totalVehicles = 50,
  averageRating = 4.9,
  totalRoutes = 200,
}: StatsRibbonProps) {
  const stats = [
    { icon: Users, number: formatNumber(totalCustomers), label: 'Happy Clients' },
    { icon: Car, number: `${totalVehicles}+`, label: 'Premium Vehicles' },
    { icon: Star, number: averageRating.toFixed(1), label: 'Average Rating' },
    { icon: MapPin, number: formatNumber(totalRoutes), label: 'Routes Available' },
  ]

  return (
    <section className="stats-ribbon" aria-label="Key statistics">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <p className="section-eyebrow text-center mb-8">By the Numbers</p>
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
