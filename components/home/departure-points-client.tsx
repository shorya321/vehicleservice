"use client"
import Link from 'next/link'
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MapPin, Plane, Building2, Hotel, Train } from "lucide-react"
import type { PopularRoute } from '@/components/search/popular-routes'

interface DeparturePointsClientProps {
  routes: PopularRoute[]
  totalRoutes: number
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

export function DeparturePointsClient({ routes, totalRoutes }: DeparturePointsClientProps) {
  return (
    <div className="section-padding">
      <div className="luxury-container">
        <motion.div
          className="section-title-wrapper"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Popular Routes</h2>
          <div className="section-divider"></div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {routes.map((route, index) => {
            const RouteIcon = getLocationIcon(route.originCity ? 'city' : undefined)

            return (
              <Link
                key={route.id}
                href={`/search/results?from=${route.originLocationId}&to=${route.destinationLocationId}&date=${new Date().toISOString().split('T')[0]}&passengers=2`}
                aria-label={`Search luxury transfers from ${route.originName} to ${route.destinationName}. Popular route, ${route.distance} kilometers, approximately ${route.duration} minutes travel time.`}
              >
                <motion.div
                  className="luxury-card luxury-card-hover flex flex-col p-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
                  viewport={{ once: true, amount: 0.3 }}
                >
                  {/* Icon + Route Name */}
                  <div className="flex items-center mb-3">
                    <RouteIcon className="w-5 h-5 text-luxury-gold mr-3 flex-shrink-0" aria-hidden="true" />
                    <h3 className="text-lg font-serif text-luxury-pearl flex-1">
                      {route.originName} → {route.destinationName}
                    </h3>
                  </div>

                  {/* Stats: Popular badge and distance */}
                  <div className="flex space-x-3 text-xs text-luxury-lightGray/80 mb-5">
                    <span className="bg-luxury-gold/10 text-luxury-gold px-2 py-0.5 rounded-full font-semibold">
                      Popular
                    </span>
                    <span>{route.distance} km</span>
                    <span>{route.duration} min</span>
                  </div>

                  {/* Choose Button */}
                  <Button variant="outline" size="default" className="w-full mt-auto border-luxury-gold/20">
                    CHOOSE
                  </Button>
                </motion.div>
              </Link>
            )
          })}
        </div>

        {/* View All Routes CTA */}
        {totalRoutes > 6 && (
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <Button variant="outline" size="lg" asChild>
              <Link href="/routes">
                ALL ROUTES
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
