'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { UseFormReturn, useFormState } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldValidationIcon } from '../field-validation-icon'

/** One field-label treatment, hoisted so it cannot drift between the two form sections. */
const FIELD_LABEL = 'checkout-field-label mb-2.5 block'

interface PassengerInfoSectionProps {
  form: UseFormReturn<any>
  /** No account signed in: the booking is made as a guest. */
  isGuest?: boolean
}

/** Off-screen and out of the tab order: people never fill it, form bots do. */
const HONEYPOT_STYLE = { position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' } as const

/** Sign in, then come straight back to this checkout with the search intact. */
function useSignInHref(): string {
  const pathname = usePathname()
  const query = useSearchParams().toString()
  const back = query ? `${pathname}?${query}` : pathname
  return `/login?redirect=${encodeURIComponent(back)}`
}

export function PassengerInfoSection({ form, isGuest = false }: PassengerInfoSectionProps) {
  const { register } = form
  // Subscribed here, not read off `form`: the form renders this section from a memoised list,
  // so errors read through the parent never re-render it and the field messages stayed hidden.
  const { errors, touchedFields } = useFormState({ control: form.control })
  const signInHref = useSignInHref()

  const fieldState = (name: string) => ({
    isTouched: !!touchedFields[name],
    hasError: !!errors[name],
    isValid: !!touchedFields[name] && !errors[name],
  })

  return (
    <div className="checkout-form-section">
      <div className="checkout-section-header">
        <h2 className="checkout-section-title editorial-eyebrow--pill"><i aria-hidden="true" />Lead passenger</h2>
        <span className="checkout-section-note">The chauffeur calls this number on arrival</span>
      </div>

      <div className="checkout-section-content space-y-6">
        {isGuest && (
          <p className="text-sm text-[var(--text-secondary)]">
            Booking as a guest. Have an account?{' '}
            <Link href={signInHref} className="checkout-vehicle-change">
              Sign in
            </Link>
          </p>
        )}

        <div aria-hidden="true" style={HONEYPOT_STYLE}>
          <label htmlFor="website">Website</label>
          <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className={FIELD_LABEL}>
              First name
            </Label>
            <div className="relative">
              <Input
                id="firstName"
                className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)] aria-[invalid=true]:border-destructive pr-10"
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
              <p id="firstName-error" className="text-sm text-destructive mt-1.5">
                {errors.firstName.message as string}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="lastName" className={FIELD_LABEL}>
              Last name
            </Label>
            <div className="relative">
              <Input
                id="lastName"
                className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)] aria-[invalid=true]:border-destructive pr-10"
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
              <p id="lastName-error" className="text-sm text-destructive mt-1.5">
                {errors.lastName.message as string}
              </p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email" className={FIELD_LABEL}>
              Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)] aria-[invalid=true]:border-destructive pr-10"
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
              <p id="email-error" className="text-sm text-destructive mt-1.5">
                {errors.email.message as string}
              </p>
            ) : (
              <p id="email-hint" className="text-xs text-[var(--text-muted)] mt-1.5">
                Your confirmation and receipt go here.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="phone" className={FIELD_LABEL}>
              Phone
            </Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                className="h-[52px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)] aria-[invalid=true]:border-destructive pr-10"
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
              <p id="phone-error" className="text-sm text-destructive mt-1.5">
                {errors.phone.message as string}
              </p>
            ) : (
              <p id="phone-hint" className="text-xs text-[var(--text-muted)] mt-1.5">
                Your chauffeur calls this number 30 minutes ahead.
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="specialRequests" className={FIELD_LABEL}>
            Notes for the chauffeur
            <span className="checkout-field-optional">· Optional</span>
          </Label>
          <Textarea
            id="specialRequests"
            className="min-h-[120px] bg-[var(--black-warm)] border-[var(--graphite)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--gold)]/15 focus:border-[var(--gold)]"
            {...register('specialRequests')}
            placeholder="Child seat position, extra stop, anything the chauffeur should know"
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}

PassengerInfoSection.displayName = 'PassengerInfoSection'
