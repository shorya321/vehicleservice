'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice } from '@/lib/currency/format'
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  Luggage,
  Mail,
  Phone,
  Printer,
  Download,
  Shield,
  Info
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface ConfirmationContentProps {
  booking: any
  primaryPassenger: any
  childSeats: any[]
  extraLuggage: any
  addons: any[]
  currentCurrency?: string
  rates?: Record<string, number>
}

export function ConfirmationContent({
  booking,
  primaryPassenger,
  childSeats,
  extraLuggage,
  addons,
  currentCurrency = 'AED',
  rates = {},
}: ConfirmationContentProps) {
  // Helper function to format price in user's currency
  const formatUserPrice = (amount: number) => formatPrice(amount, currentCurrency, rates)
  const isConverted = currentCurrency !== 'AED'

  return (
    <div className="relative bg-luxury-black min-h-screen py-12 md:py-16 lg:py-20">
      {/* Ambient Background Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-luxury-gold/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="luxury-container max-w-4xl relative z-10">
        {/* Success Message */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-luxury-gold to-luxury-gold/80 rounded-full mb-6 shadow-luxury"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            aria-hidden="true"
          >
            <CheckCircle className="h-10 w-10 text-luxury-black" />
          </motion.div>
          <span className="sr-only">Booking successfully confirmed</span>
          <motion.h1
            className="font-serif text-4xl md:text-5xl text-luxury-pearl mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Booking Confirmed!
          </motion.h1>
          <motion.p
            className="text-luxury-lightGray text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Your transfer has been successfully booked. Confirmation sent to{' '}
            <span className="text-luxury-gold font-medium">{primaryPassenger?.email}</span>
          </motion.p>
        </motion.div>

        {/* Booking Details Card */}
        <motion.div
          className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="bg-gradient-to-br from-luxury-gold/10 to-transparent p-6 border-b border-luxury-gold/20">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-luxury-pearl">Booking Details</h2>
                <p className="text-sm text-luxury-lightGray mt-2">
                  Reference: <span className="font-mono font-semibold text-luxury-gold">{booking.booking_number}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-luxury-gold/30 text-luxury-lightGray hover:bg-luxury-gold/10 hover:text-luxury-pearl uppercase tracking-wider font-sans focus:ring-2 focus:ring-luxury-gold focus:ring-offset-2 focus:ring-offset-luxury-black"
                  aria-label="Print booking confirmation"
                >
                  <Printer className="h-4 w-4 mr-2" style={{ color: "#C6AA88" }} aria-hidden="true" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-luxury-gold/30 text-luxury-lightGray hover:bg-luxury-gold/10 hover:text-luxury-pearl uppercase tracking-wider font-sans focus:ring-2 focus:ring-luxury-gold focus:ring-offset-2 focus:ring-offset-luxury-black"
                  aria-label="Download booking confirmation as PDF"
                >
                  <Download className="h-4 w-4 mr-2" style={{ color: "#C6AA88" }} aria-hidden="true" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            {/* Route Information */}
            <div>
              <h3 className="font-serif text-xl text-luxury-pearl mb-4">Journey Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5" style={{ color: "#C6AA88" }} aria-hidden="true" />
                  <div className="flex-1">
                    <p className="font-medium text-luxury-pearl mb-1">Pickup Location</p>
                    <p className="text-sm text-luxury-lightGray">{booking.pickup_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 mt-0.5" style={{ color: "#C6AA88" }} aria-hidden="true" />
                  <div className="flex-1">
                    <p className="font-medium text-luxury-pearl mb-1">Drop-off Location</p>
                    <p className="text-sm text-luxury-lightGray">{booking.dropoff_address}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="border-luxury-gold/20" />

            {/* Date, Time & Vehicle */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-serif text-xl text-luxury-pearl mb-4">Pickup Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
                    <span className="text-sm text-luxury-lightGray">
                      {format(new Date(booking.pickup_datetime), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
                    <span className="text-sm text-luxury-lightGray">
                      {format(new Date(booking.pickup_datetime), 'HH:mm')} (24-hour format)
                    </span>
                  </div>
                </div>
              </div>

              {booking.vehicle_type && (
                <div>
                  <h3 className="font-serif text-xl text-luxury-pearl mb-4">Vehicle Type</h3>
                  <div className="space-y-3">
                    <p className="font-medium text-luxury-pearl">{booking.vehicle_type.name}</p>
                    <div className="flex items-center gap-4 text-sm text-luxury-lightGray">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
                        <span>Up to {booking.vehicle_type.passenger_capacity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Luggage className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
                        <span>Up to {booking.vehicle_type.luggage_capacity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator className="border-luxury-gold/20" />

            {/* Passenger Information */}
            {primaryPassenger && (
              <>
                <div>
                  <h3 className="font-serif text-xl text-luxury-pearl mb-4">Passenger Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-luxury-lightGray uppercase tracking-wider mb-1">Name</p>
                      <p className="font-medium text-luxury-pearl">
                        {primaryPassenger.first_name} {primaryPassenger.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-luxury-lightGray uppercase tracking-wider mb-1">Contact</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
                          <span className="text-sm text-luxury-lightGray">{primaryPassenger.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" style={{ color: "#C6AA88" }} aria-hidden="true" />
                          <span className="text-sm text-luxury-lightGray">{primaryPassenger.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <Separator className="border-luxury-gold/20" />
              </>
            )}

            {/* Booking Summary */}
            <div>
              <h3 className="font-serif text-xl text-luxury-pearl mb-4">Booking Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-luxury-lightGray">
                    {booking.passenger_count} Passenger{booking.passenger_count > 1 ? 's' : ''}
                  </span>
                  <span className="text-luxury-pearl">{formatUserPrice(booking.base_price)}</span>
                </div>

                {childSeats.length > 0 && (
                  <>
                    {childSeats.map((seat: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-luxury-lightGray">
                          {seat.amenity_type === 'child_seat_infant' ? 'Infant Seat' : 'Booster Seat'}
                          {seat.quantity > 1 ? ` x${seat.quantity}` : ''}
                        </span>
                        <span className="text-luxury-pearl">{formatUserPrice(seat.price)}</span>
                      </div>
                    ))}
                  </>
                )}

                {extraLuggage && (
                  <div className="flex justify-between text-sm">
                    <span className="text-luxury-lightGray">
                      Extra Luggage x{extraLuggage.quantity}
                    </span>
                    <span className="text-luxury-pearl">{formatUserPrice(extraLuggage.price)}</span>
                  </div>
                )}

                {addons.length > 0 && (
                  <>
                    {addons.map((addon: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-luxury-lightGray">
                          {addon.addon?.name || 'Additional Service'}
                          {addon.quantity > 1 ? ` x${addon.quantity}` : ''}
                        </span>
                        <span className="text-luxury-pearl">{formatUserPrice(addon.price)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-luxury-lightGray">Services Total</span>
                      <span className="text-luxury-pearl">
                        {formatUserPrice(addons.reduce((sum: number, a: any) => sum + a.price, 0))}
                      </span>
                    </div>
                  </>
                )}

                <Separator className="border-luxury-gold/30 my-2" />

                <div className="flex justify-between font-semibold pt-2">
                  <span className="text-luxury-pearl">Total Paid</span>
                  <span className="text-xl text-luxury-gold font-serif">{formatUserPrice(booking.total_price)}</span>
                </div>

                {booking.payment_status === 'completed' && (
                  <div className="flex items-center gap-2 text-sm text-luxury-gold mt-3">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    <span>Payment confirmed</span>
                  </div>
                )}

                {/* Currency Notice */}
                {isConverted && (
                  <div className="flex items-start gap-2 mt-4 text-xs text-luxury-lightGray/70">
                    <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-luxury-gold/60" aria-hidden="true" />
                    <span>
                      Prices shown in {currentCurrency}. Payment was processed in AED ({formatPrice(booking.total_price, 'AED', rates)}).
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Special Requests */}
            {booking.customer_notes && (
              <>
                <Separator className="border-luxury-gold/20" />
                <div>
                  <h3 className="font-serif text-xl text-luxury-pearl mb-3">Special Requests</h3>
                  <p className="text-sm text-luxury-lightGray leading-relaxed">{booking.customer_notes}</p>
                </div>
              </>
            )}

            {/* Important Information */}
            <Separator className="border-luxury-gold/20" />
            <div className="bg-luxury-gold/5 border border-luxury-gold/20 rounded-lg p-6">
              <h3 className="font-serif text-xl text-luxury-pearl mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" style={{ color: "#C6AA88" }} aria-hidden="true" />
                Important Information
              </h3>
              <ul className="space-y-2 text-sm text-luxury-lightGray">
                <li className="flex items-start gap-2">
                  <span className="text-luxury-gold mt-0.5">•</span>
                  <span>Please be ready at your pickup location 5 minutes before the scheduled time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-luxury-gold mt-0.5">•</span>
                  <span>Your driver will wait up to 15 minutes after the scheduled pickup time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-luxury-gold mt-0.5">•</span>
                  <span>Free cancellation up to 24 hours before pickup</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-luxury-gold mt-0.5">•</span>
                  <span>For any changes or inquiries, please contact our support team</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row justify-center gap-4 mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link href="/">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-14 px-8 border-luxury-gold/30 text-luxury-lightGray hover:bg-luxury-gold/10 hover:text-luxury-pearl uppercase tracking-wider font-semibold focus:ring-2 focus:ring-luxury-gold focus:ring-offset-2 focus:ring-offset-luxury-black"
            >
              Book Another Transfer
            </Button>
          </Link>
          <Link href="/account">
            <Button className="w-full sm:w-auto h-14 px-8 bg-luxury-gold hover:bg-luxury-gold/90 text-luxury-black uppercase tracking-wider font-semibold transition-all duration-300 active:scale-95 focus:ring-2 focus:ring-luxury-gold focus:ring-offset-2 focus:ring-offset-luxury-black">
              View My Bookings
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
