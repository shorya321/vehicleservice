'use client'

import Link from 'next/link'
import { SearchX, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'motion/react'

interface EmptyStateProps {
  searchParams: {
    from?: string
    to?: string
    date?: string
    passengers?: string
  }
}

export function EmptyState({ searchParams }: EmptyStateProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        className="text-center space-y-8 max-w-2xl backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="mx-auto w-20 h-20 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <SearchX className="h-10 w-10 text-luxury-gold" aria-hidden="true" />
        </motion.div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-serif text-3xl md:text-4xl text-luxury-pearl">
            No Vehicles Available
          </h2>
          <p className="text-luxury-lightGray leading-relaxed">
            We couldn&apos;t find any available vehicles for your selected route and date.
            This could be because the route is not currently serviced or all vehicles are booked.
          </p>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm text-luxury-lightGray/80 uppercase tracking-wider">
            Try one of these options:
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="h-14 uppercase tracking-wider bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black font-semibold active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2 focus-visible:ring-offset-luxury-darkGray"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-5 w-5" aria-hidden="true" />
                Search Different Route
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 uppercase tracking-wider border-luxury-gold/30 text-luxury-lightGray hover:bg-luxury-gold/10 hover:text-luxury-pearl active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2 focus-visible:ring-offset-luxury-darkGray"
            >
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}