'use client'

import { UseFormReturn } from 'react-hook-form'
import { motion, useReducedMotion } from 'motion/react'
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
              <User className="h-4 w-4 text-[var(--gold-text)]" />
              Primary Passenger
            </div>
            <span className="checkout-passenger-badge">Lead</span>
          </div>

          <div className="space-y-4">
            {/* Name Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="mb-3 block text-[var(--text-secondary)] text-sm">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  className="h-14 bg-[var(--black-warm)]/50 border-[var(--gold)]/20 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold)]"
                  {...register('firstName')}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{errors.firstName.message as string}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName" className="mb-3 block text-[var(--text-secondary)] text-sm">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  className="h-14 bg-[var(--black-warm)]/50 border-[var(--gold)]/20 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold)]"
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
                <Label htmlFor="email" className="flex items-center gap-2 mb-3 text-[var(--text-secondary)] text-sm">
                  <Mail className="h-4 w-4 text-[var(--gold-text)]" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="h-14 bg-[var(--black-warm)]/50 border-[var(--gold)]/20 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold)]"
                  {...register('email')}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message as string}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-3 text-[var(--text-secondary)] text-sm">
                  <Phone className="h-4 w-4 text-[var(--gold-text)]" />
                  Phone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  className="h-14 bg-[var(--black-warm)]/50 border-[var(--gold)]/20 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold)]"
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
              <Label htmlFor="specialRequests" className="flex items-center gap-2 mb-3 text-[var(--text-secondary)] text-sm">
                <MessageSquare className="h-4 w-4 text-[var(--gold-text)]" />
                Special Requests (Optional)
              </Label>
              <Textarea
                id="specialRequests"
                className="min-h-[100px] bg-[var(--black-warm)]/50 border-[var(--gold)]/20 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold)]"
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
