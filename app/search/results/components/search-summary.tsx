'use client'

import { format } from 'date-fns'
import { MapPin, Calendar, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

interface Location {
  id: string
  name: string
  city: string
  country: string
}

interface SearchSummaryProps {
  originId: string
  destinationId: string
  date: Date
  passengers: number
}

export function SearchSummary({ originId, destinationId, date, passengers }: SearchSummaryProps) {
  const [origin, setOrigin] = useState<Location | null>(null)
  const [destination, setDestination] = useState<Location | null>(null)

  useEffect(() => {
    // Fetch location details client-side
    async function fetchLocationDetails() {
      try {
        const { getLocationDetails } = await import('../actions')
        const [originData, destinationData] = await Promise.all([
          getLocationDetails(originId),
          getLocationDetails(destinationId)
        ])
        setOrigin(originData)
        setDestination(destinationData)
      } catch (error) {
        console.error('Error fetching location details:', error)
      }
    }

    fetchLocationDetails()
  }, [originId, destinationId])

  return (
    <motion.header
      className="relative bg-gradient-to-b from-luxury-void to-luxury-rich border-b border-luxury-gold/10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtle bottom gradient line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-px bg-gradient-to-r from-transparent via-luxury-gold/30 to-transparent" />

      <div className="luxury-container py-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.1em] uppercase text-luxury-lightGray hover:text-luxury-gold transition-colors duration-200 mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
          Back to Search
        </Link>

        {/* Search Summary Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="flex items-center justify-center w-[18px] h-[18px]">
              <MapPin className="h-[18px] w-[18px] text-luxury-gold" aria-hidden="true" />
            </div>
            <div>
              <div className="text-[0.7rem] font-medium tracking-[0.15em] uppercase text-luxury-lightGray/70">Route</div>
              <div className="flex items-center gap-2 text-luxury-pearl">
                <span>{origin?.city || '...'}</span>
                <span className="text-luxury-gold font-serif">&rarr;</span>
                <span>{destination?.city || '...'}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center justify-center w-[18px] h-[18px]">
              <Calendar className="h-[18px] w-[18px] text-luxury-gold" aria-hidden="true" />
            </div>
            <div>
              <div className="text-[0.7rem] font-medium tracking-[0.15em] uppercase text-luxury-lightGray/70">Date</div>
              <div className="text-luxury-pearl">
                {format(date, 'EEE, MMM d, yyyy')}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center justify-center w-[18px] h-[18px]">
              <Users className="h-[18px] w-[18px] text-luxury-gold" aria-hidden="true" />
            </div>
            <div>
              <div className="text-[0.7rem] font-medium tracking-[0.15em] uppercase text-luxury-lightGray/70">Passengers</div>
              <div className="text-luxury-pearl">
                {passengers} {passengers === 1 ? 'Passenger' : 'Passengers'}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}
