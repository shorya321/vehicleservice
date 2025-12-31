'use client'

import Image from 'next/image'
import Link from 'next/link'
import { VehicleTypeResult } from '../actions'
import { motion } from 'framer-motion'
import {
  Users,
  Briefcase,
  Clock,
  CheckCircle,
  Star
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

  // Default rating if not available
  const rating = 4.8

  return (
    <motion.article
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[rgba(22,21,20,0.95)] to-[rgba(15,14,13,0.98)] border border-[rgba(198,170,136,0.12)] h-full flex flex-col group transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:border-[rgba(198,170,136,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_30px_-10px_rgba(198,170,136,0.2)]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      {/* Top Border Accent - Appears on Hover */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-luxury-gold to-luxury-goldDeep opacity-0 group-hover:opacity-100 transition-opacity duration-[400ms]" />

      {/* Vehicle Type Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-luxury-charcoal">
        <Image
          src={vehicleTypeImage}
          alt={vehicleType.name}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Image Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-charcoal via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Vehicle Type Details */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Header: Title, Model, Rating */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-xl text-luxury-pearl mb-0.5 truncate">
              {vehicleType.name}
            </h3>
            <p className="text-sm text-[var(--text-muted)] truncate">
              {models}
            </p>
          </div>
          {/* Rating Badge */}
          <div className="flex items-center gap-1 px-2 py-1 bg-luxury-graphite/50 rounded-md shrink-0">
            <Star className="h-3.5 w-3.5 fill-luxury-gold text-luxury-gold" aria-hidden="true" />
            <span className="text-xs font-medium text-luxury-pearl">{rating}</span>
          </div>
        </div>

        {/* Specs: Capacity & Luggage */}
        <div className="flex items-center gap-5 pb-3 mb-3 border-b border-luxury-gold/10">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-luxury-gold" aria-hidden="true" />
            <span className="text-sm text-[var(--text-secondary)]">{vehicleType.capacity} passengers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-luxury-gold" aria-hidden="true" />
            <span className="text-sm text-[var(--text-secondary)]">{vehicleType.luggageCapacity} luggage</span>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
          <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
            <Clock className="h-3.5 w-3.5 text-luxury-gold" aria-hidden="true" />
            <span>15 min waiting</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-500">
            <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Free cancellation</span>
          </div>
        </div>

        {/* Spacer to push footer to bottom */}
        <div className="flex-1" />

        {/* Footer: Price & CTA */}
        <div className="flex items-end justify-between gap-4">
          {/* Price */}
          <div>
            <div className="font-serif text-2xl md:text-3xl font-medium bg-gradient-to-br from-luxury-goldCream via-luxury-gold to-luxury-goldDark bg-clip-text text-transparent leading-none">
              {formatCurrency(vehicleType.price)}
            </div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-[0.05em] mt-0.5">per vehicle</p>
          </div>

          {/* Action Button */}
          {vehicleType.availableVehicles === 0 ? (
            <button
              className="px-6 py-3 bg-luxury-graphite/50 border-none rounded-lg text-[0.75rem] font-semibold tracking-[0.1em] uppercase text-luxury-textMuted cursor-not-allowed opacity-50"
              disabled
            >
              Unavailable
            </button>
          ) : (
            <Link
              href={selectionUrl}
              className="btn btn-primary text-xs"
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  )
}
