'use client'

import { format } from 'date-fns'
import { MapPin, Calendar, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
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
    <motion.div
      className="backdrop-blur-lg bg-luxury-darkGray/80 border-b border-luxury-gold/20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="luxury-container py-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-luxury-pearl hover:text-luxury-gold hover:bg-luxury-gold/10 uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2 focus-visible:ring-offset-luxury-black"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <MapPin className="h-5 w-5 flex-shrink-0 text-luxury-gold" aria-hidden="true" />
            <div>
              <div className="text-sm text-luxury-lightGray/80">Route</div>
              <div className="font-serif text-lg text-luxury-pearl">
                {origin?.city || '...'} → {destination?.city || '...'}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Calendar className="h-5 w-5 flex-shrink-0 text-luxury-gold" aria-hidden="true" />
            <div>
              <div className="text-sm text-luxury-lightGray/80">Date</div>
              <div className="font-serif text-lg text-luxury-pearl">
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
            <Users className="h-5 w-5 flex-shrink-0 text-luxury-gold" aria-hidden="true" />
            <div>
              <div className="text-sm text-luxury-lightGray/80">Passengers</div>
              <div className="font-serif text-lg text-luxury-pearl">
                {passengers} {passengers === 1 ? 'Passenger' : 'Passengers'}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
