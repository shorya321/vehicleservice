'use client'

import Image from 'next/image'
import Link from 'next/link'
import { VehicleTypeResult } from '../actions'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {
  Users,
  Briefcase,
  Clock,
  CheckCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface VehicleTypeGridCardProps {
  vehicleType: VehicleTypeResult
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
  index?: number
}

// Sample vehicle models for each type (temporary until added to database)
const vehicleModels: Record<string, string> = {
  'economy-sedan': 'Toyota Etios, Maruti Swift',
  'sedan': 'Honda City, Maruti Ciaz',
  'luxury-sedan': 'Mercedes E-Class, BMW 5 Series',
  'suv': 'Toyota Innova, Mahindra XUV',
  'luxury-suv': 'Audi Q7, BMW X5',
  'minivan': 'Toyota Hiace, Tempo Traveller',
  'van': 'Force Traveller',
  'minibus': '20-Seater Bus',
  'bus': '35-Seater Bus, 45-Seater Bus'
}

export function VehicleTypeGridCard({ vehicleType, searchParams, index = 0 }: VehicleTypeGridCardProps) {
  const vehicleTypeImage = vehicleType.image || `/images/vehicle-types/${vehicleType.slug}.jpg`
  const models = vehicleModels[vehicleType.slug] || vehicleType.name

  const selectionUrl = `/checkout?${new URLSearchParams({
    vehicleType: vehicleType.id,
    ...searchParams
  }).toString()}`

  return (
    <motion.div
      className="luxury-card luxury-card-hover overflow-hidden h-full flex flex-col group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: "easeOut"
      }}
      whileHover={{
        y: -8,
        rotateY: 2,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
    >
      {/* Vehicle Type Image */}
      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-luxury-gray to-luxury-darkGray">
        <Image
          src={vehicleTypeImage}
          alt={vehicleType.name}
          fill
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      {/* Vehicle Type Details */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Title and Models */}
        <div className="mb-4">
          <h3 className="font-serif text-xl text-luxury-pearl mb-1">
            {vehicleType.name}
          </h3>
          <p className="text-sm text-luxury-lightGray line-clamp-1">
            {models}
          </p>
        </div>

        {/* Capacity Info */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-luxury-gold" aria-hidden="true" />
            <span className="text-luxury-lightGray">{vehicleType.capacity}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-luxury-gold" aria-hidden="true" />
            <span className="text-luxury-lightGray">{vehicleType.luggageCapacity}</span>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1 text-xs text-luxury-lightGray/80">
            <Clock className="h-3.5 w-3.5 text-luxury-gold" aria-hidden="true" />
            <span>15 min waiting</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-500">
            <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Free cancellation</span>
          </div>
        </div>

        {/* Spacer to push price and button to bottom */}
        <div className="flex-1" />

        {/* Price */}
        <div className="mb-4">
          <div className="font-serif text-3xl text-luxury-gold">
            {formatCurrency(vehicleType.price)}
          </div>
          <p className="text-xs text-luxury-lightGray/80">per vehicle</p>
        </div>

        {/* Action Button */}
        {vehicleType.availableVehicles === 0 ? (
          <Button
            className="w-full uppercase tracking-wider"
            size="lg"
            disabled
          >
            Currently Unavailable
          </Button>
        ) : (
          <Button
            asChild
            className="w-full uppercase tracking-wider active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2 focus-visible:ring-offset-luxury-black"
            size="lg"
          >
            <Link href={selectionUrl}>
              Book Now
            </Link>
          </Button>
        )}
      </div>
    </motion.div>
  )
}
