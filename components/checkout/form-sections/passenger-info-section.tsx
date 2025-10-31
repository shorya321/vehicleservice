'use client'

import { UseFormReturn } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PassengerInfoSectionProps {
  form: UseFormReturn<any>
}

/**
 * Passenger Information Section Component
 *
 * Collects primary passenger details:
 * - First name and last name
 * - Email address
 * - Phone number
 *
 * All fields are required and validated through the form schema.
 *
 * @component
 */
export function PassengerInfoSection({ form }: PassengerInfoSectionProps) {
  const { register, formState: { errors } } = form

  return (
    <motion.div
      className="luxury-card backdrop-blur-md bg-luxury-darkGray/80 border border-luxury-gold/20 rounded-lg p-6 md:p-8 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h2 className="font-serif text-3xl text-luxury-pearl mb-6">Passenger Information</h2>

      <div className="space-y-4">
        {/* Name Fields */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="mb-2 block text-luxury-lightGray">
              First Name *
            </Label>
            <Input
              id="firstName"
              className="h-14 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
              {...register('firstName')}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-sm text-red-500 mt-1">{errors.firstName.message as string}</p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName" className="mb-2 block text-luxury-lightGray">
              Last Name *
            </Label>
            <Input
              id="lastName"
              className="h-14 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
              {...register('lastName')}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-sm text-red-500 mt-1">{errors.lastName.message as string}</p>
            )}
          </div>
        </div>

        {/* Contact Fields */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email" className="mb-2 block text-luxury-lightGray">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              className="h-14 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
              {...register('email')}
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message as string}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone" className="mb-2 block text-luxury-lightGray">
              Phone *
            </Label>
            <Input
              id="phone"
              type="tel"
              className="h-14 bg-luxury-black/40 border-luxury-gold/20 text-luxury-pearl placeholder:text-luxury-lightGray/50 focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
              {...register('phone')}
              placeholder="+1 234 567 8900"
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone.message as string}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

PassengerInfoSection.displayName = 'PassengerInfoSection'
