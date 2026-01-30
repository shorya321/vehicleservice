'use client'

import Image from 'next/image'
import Link from 'next/link'
import { SearchResultVehicle } from '../actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Briefcase,
  Star,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react'
import { formatPrice } from '@/lib/currency/format'
import { motion } from 'motion/react'

interface VehicleCardProps {
  vehicle: SearchResultVehicle
  routeId: string
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
  currentCurrency: string
  exchangeRates: Record<string, number>
  index?: number
}

export function VehicleCard({ vehicle, routeId, searchParams, currentCurrency, exchangeRates, index = 0 }: VehicleCardProps) {
  const vehicleImage = vehicle.images[0] || '/placeholder-vehicle.jpg'

  const bookingUrl = `/booking/vehicle/${vehicle.id}?${new URLSearchParams({
    route: routeId,
    ...searchParams
  }).toString()}`

  return (
    <motion.div
      className="luxury-card luxury-card-hover overflow-hidden group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: "easeOut"
      }}
      whileHover={{ y: -4 }}
    >
      <div className="grid md:grid-cols-[300px,1fr] gap-0">
        {/* Vehicle Image */}
        <div className="relative h-48 md:h-full bg-gradient-to-br from-luxury-gray to-luxury-darkGray overflow-hidden">
          <Image
            src={vehicleImage}
            alt={vehicle.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 300px"
          />
          <Badge
            className={`absolute top-4 left-4 ${vehicle.category === 'Premium'
              ? 'bg-luxury-gold text-luxury-black'
              : 'bg-luxury-darkGray/80 text-luxury-pearl border-luxury-gold/30'
              }`}
          >
            {vehicle.category}
          </Badge>
        </div>

        {/* Vehicle Details */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h3 className="font-serif text-2xl md:text-3xl text-luxury-pearl mb-2">
                {vehicle.name}
              </h3>
              <p className="text-sm text-luxury-lightGray/80">
                Provided by <span className="text-luxury-gold">{vehicle.vendorName}</span>
              </p>
            </div>

            <div className="text-right">
              {vehicle.originalPrice && (
                <div className="text-sm text-luxury-lightGray/60 line-through">
                  {formatPrice(vehicle.originalPrice, currentCurrency, exchangeRates)}
                </div>
              )}
              <div className="font-serif text-3xl font-bold text-luxury-gold">
                {formatPrice(vehicle.price, currentCurrency, exchangeRates)}
              </div>
              <div className="text-xs text-luxury-lightGray/80 uppercase tracking-wider">
                per vehicle
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-luxury-gold" aria-hidden="true" />
              <span className="text-luxury-lightGray">Up to {vehicle.capacity} passengers</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-luxury-gold" aria-hidden="true" />
              <span className="text-luxury-lightGray">{vehicle.luggageCapacity} suitcases</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-luxury-gold" aria-hidden="true" />
              <span className="text-luxury-lightGray">{vehicle.duration} journey</span>
            </div>
            {vehicle.vendorRating > 0 && (
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-luxury-gold text-luxury-gold" aria-hidden="true" />
                <span className="text-luxury-lightGray">{vehicle.vendorRating.toFixed(1)} rating</span>
              </div>
            )}
          </div>

          {/* Features */}
          {vehicle.features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {vehicle.features.slice(0, 4).map(feature => (
                <Badge
                  key={feature}
                  variant="outline"
                  className="text-xs border-luxury-gold/30 text-luxury-lightGray bg-luxury-gold/5 hover:bg-luxury-gold/10 transition-colors"
                >
                  {feature}
                </Badge>
              ))}
              {vehicle.features.length > 4 && (
                <Badge
                  variant="outline"
                  className="text-xs border-luxury-gold/30 text-luxury-gold bg-luxury-gold/10"
                >
                  +{vehicle.features.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* Benefits */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            {vehicle.instantConfirmation && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                <span className="text-luxury-lightGray">Instant confirmation</span>
              </div>
            )}
            <div className="text-luxury-lightGray/80">{vehicle.cancellationPolicy}</div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black font-sans font-semibold uppercase tracking-wider transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2 focus-visible:ring-offset-luxury-darkGray"
            >
              <Link href={bookingUrl}>
                Select Vehicle
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
