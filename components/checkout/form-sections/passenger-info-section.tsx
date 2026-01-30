'use client'

import { UseFormReturn } from 'react-hook-form'
import { motion } from 'motion/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { User, Mail, Phone, MessageSquare } from 'lucide-react'

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
 * - Special requests
 *
 * All fields are required and validated through the form schema.
 *
 * @component
 */
export function PassengerInfoSection({ form }: PassengerInfoSectionProps) {
  const { register, formState: { errors } } = form

  return (
    <motion.div
      className="checkout-form-section"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Section Header */}
      <div className="checkout-section-header">
        <span className="checkout-section-number">2</span>
        <h2 className="checkout-section-title">Passenger Information</h2>
        <User className="checkout-section-icon" />
      </div>

      {/* Section Content */}
      <div className="checkout-section-content">
        {/* Lead Passenger Card */}
        <div className="checkout-passenger-card">
          <div className="checkout-passenger-header">
            <div className="checkout-passenger-title">
              <User className="h-4 w-4 text-[#c6aa88]" />
              Primary Passenger
            </div>
            <span className="checkout-passenger-badge">Lead</span>
          </div>

          <div className="space-y-4">
            {/* Name Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="mb-3 block text-[#b8b4ae] text-sm">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  className="h-14 bg-[#1f1e1c]/50 border-[#c6aa88]/20 text-[#f8f6f3] placeholder:text-[#7a7672]/50 focus:ring-2 focus:ring-[#c6aa88] focus:border-[#c6aa88]"
                  {...register('firstName')}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{errors.firstName.message as string}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName" className="mb-3 block text-[#b8b4ae] text-sm">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  className="h-14 bg-[#1f1e1c]/50 border-[#c6aa88]/20 text-[#f8f6f3] placeholder:text-[#7a7672]/50 focus:ring-2 focus:ring-[#c6aa88] focus:border-[#c6aa88]"
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
                <Label htmlFor="email" className="flex items-center gap-2 mb-3 text-[#b8b4ae] text-sm">
                  <Mail className="h-4 w-4 text-[#c6aa88]" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="h-14 bg-[#1f1e1c]/50 border-[#c6aa88]/20 text-[#f8f6f3] placeholder:text-[#7a7672]/50 focus:ring-2 focus:ring-[#c6aa88] focus:border-[#c6aa88]"
                  {...register('email')}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message as string}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-3 text-[#b8b4ae] text-sm">
                  <Phone className="h-4 w-4 text-[#c6aa88]" />
                  Phone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  className="h-14 bg-[#1f1e1c]/50 border-[#c6aa88]/20 text-[#f8f6f3] placeholder:text-[#7a7672]/50 focus:ring-2 focus:ring-[#c6aa88] focus:border-[#c6aa88]"
                  {...register('phone')}
                  placeholder="+1 234 567 8900"
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone.message as string}</p>
                )}
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <Label htmlFor="specialRequests" className="flex items-center gap-2 mb-3 text-[#b8b4ae] text-sm">
                <MessageSquare className="h-4 w-4 text-[#c6aa88]" />
                Special Requests (Optional)
              </Label>
              <Textarea
                id="specialRequests"
                className="min-h-[100px] bg-[#1f1e1c]/50 border-[#c6aa88]/20 text-[#f8f6f3] placeholder:text-[#7a7672]/50 focus:ring-2 focus:ring-[#c6aa88] focus:border-[#c6aa88]"
                {...register('specialRequests')}
                placeholder="Any special requirements or requests..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

PassengerInfoSection.displayName = 'PassengerInfoSection'
