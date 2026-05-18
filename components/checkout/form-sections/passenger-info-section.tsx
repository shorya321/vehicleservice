'use client'

import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { User, Mail, Phone, MessageSquare } from 'lucide-react'
import { FieldValidationIcon } from '../field-validation-icon'

interface PassengerInfoSectionProps {
  form: UseFormReturn<any>
}

export function PassengerInfoSection({ form }: PassengerInfoSectionProps) {
  const { register, formState: { errors, touchedFields } } = form

  const fieldState = (name: string) => ({
    isTouched: !!touchedFields[name],
    hasError: !!errors[name],
    isValid: !!touchedFields[name] && !errors[name],
  })

  return (
    <div className="checkout-form-section">
      <div className="checkout-section-header">
        <h2 className="checkout-section-title">Passenger Information</h2>
        <User className="checkout-section-icon" aria-hidden="true" />
      </div>

      <div className="checkout-section-content">
        <div className="checkout-passenger-card">
          <div className="checkout-passenger-header">
            <div className="checkout-passenger-title">
              <User className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
              Primary Passenger
            </div>
            <span className="checkout-passenger-badge">Lead</span>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="mb-2.5 block text-[var(--text-secondary)] text-sm">
                  First Name
                </Label>
                <div className="relative">
                  <Input
                    id="firstName"
                    className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)] pr-10"
                    {...register('firstName')}
                    placeholder="John"
                    aria-required="true"
                    aria-invalid={!!errors.firstName}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <FieldValidationIcon {...fieldState('firstName')} />
                  </div>
                </div>
                {errors.firstName && (
                  <p id="firstName-error" role="alert" className="text-sm text-[var(--destructive)] mt-1.5">
                    {errors.firstName.message as string}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName" className="mb-2.5 block text-[var(--text-secondary)] text-sm">
                  Last Name
                </Label>
                <div className="relative">
                  <Input
                    id="lastName"
                    className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)] pr-10"
                    {...register('lastName')}
                    placeholder="Doe"
                    aria-required="true"
                    aria-invalid={!!errors.lastName}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <FieldValidationIcon {...fieldState('lastName')} />
                  </div>
                </div>
                {errors.lastName && (
                  <p id="lastName-error" role="alert" className="text-sm text-[var(--destructive)] mt-1.5">
                    {errors.lastName.message as string}
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2.5 text-[var(--text-secondary)] text-sm">
                  <Mail className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)] pr-10"
                    {...register('email')}
                    placeholder="john@example.com"
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : 'email-hint'}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <FieldValidationIcon {...fieldState('email')} />
                  </div>
                </div>
                {errors.email ? (
                  <p id="email-error" role="alert" className="text-sm text-[var(--destructive)] mt-1.5">
                    {errors.email.message as string}
                  </p>
                ) : (
                  <p id="email-hint" className="text-xs text-[var(--text-muted)] mt-1.5">
                    Booking confirmation sent here
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2.5 text-[var(--text-secondary)] text-sm">
                  <Phone className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                  Phone
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)] pr-10"
                    {...register('phone')}
                    placeholder="+971 50 123 4567"
                    aria-required="true"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <FieldValidationIcon {...fieldState('phone')} />
                  </div>
                </div>
                {errors.phone ? (
                  <p id="phone-error" role="alert" className="text-sm text-[var(--destructive)] mt-1.5">
                    {errors.phone.message as string}
                  </p>
                ) : (
                  <p id="phone-hint" className="text-xs text-[var(--text-muted)] mt-1.5">
                    Include country code, e.g. +971 50 123 4567
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="specialRequests" className="flex items-center gap-2 mb-2.5 text-[var(--text-secondary)] text-sm">
                <MessageSquare className="h-3.5 w-3.5 text-[var(--gold-text)]" aria-hidden="true" />
                Special Requests
                <span className="text-[var(--text-muted)]">(optional)</span>
              </Label>
              <Textarea
                id="specialRequests"
                className="min-h-[100px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)]"
                {...register('specialRequests')}
                placeholder="Any special requirements or requests"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

PassengerInfoSection.displayName = 'PassengerInfoSection'
