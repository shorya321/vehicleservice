"use client"
import Link from 'next/link'
import { motion } from "motion/react"
import { MapPin, Plane, Building2, Hotel, Train, ArrowRight } from "lucide-react"
import type { PopularRoute } from '@/components/search/popular-routes'

interface DeparturePointsClientProps {
  routes: PopularRoute[]
  totalRoutes: number
  todayDate: string
}

// Get icon based on location type
const getLocationIcon = (type?: string) => {
  switch(type) {
    case 'airport':
      return Plane
    case 'city':
      return Building2
    case 'hotel':
      return Hotel
    case 'station':
      return Train
    default:
      return MapPin
  }
}

export function DeparturePointsClient({ routes, totalRoutes, todayDate }: DeparturePointsClientProps) {
  return (
    <section className="section-padding routes-section">
      <div className="luxury-container">
        {/* Section Header */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <span className="section-eyebrow">Discover</span>
          <h2 className="section-title">Popular Routes</h2>
          <div className="section-divider">
            <div className="section-divider-icon"></div>
          </div>
          <p className="section-subtitle">
            Explore our most requested transfer routes, handpicked for seamless travel experiences.
          </p>
        </motion.div>

        {/* Routes Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route, index) => {
            const RouteIcon = getLocationIcon(route.originCity ? 'city' : undefined)

            return (
              <Link
                key={route.id}
                href={`/search/results?from=${route.originLocationId}&to=${route.destinationLocationId}&date=${todayDate}&passengers=2`}
                aria-label={`Search luxury transfers from ${route.originName} to ${route.destinationName}`}
              >
                <motion.div
                  className="route-card group h-full"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  {/* Header with Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <span className="luxury-badge">Popular</span>
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20">
                      <RouteIcon className="w-5 h-5 text-[var(--gold)]" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Route Names */}
                  <div className="mb-4">
                    <h3 className="font-display text-xl text-[var(--text-primary)] mb-1">
                      {route.originName}
                    </h3>
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <ArrowRight className="w-4 h-4 text-[var(--gold)]" />
                      <span className="text-sm">{route.destinationName}</span>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-6">
                    <span>{route.distance} km</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--gold)]/50"></span>
                    <span>~{route.duration} min</span>
                  </div>

                  {/* CTA */}
                  <div className="route-btn text-center">
                    Book Now
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </div>

        {/* View All Routes CTA */}
        {totalRoutes > 6 && (
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Link href="/routes" className="btn btn-secondary">
              View All Routes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
