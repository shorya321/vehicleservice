'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, ChevronDown } from 'lucide-react'
import { submitContactForm } from '../actions'

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional().or(z.literal('')),
  subject: z.enum(['general', 'booking', 'corporate', 'fleet', 'feedback', 'other']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be under 2000 characters'),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

const subjectOptions = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'booking', label: 'Booking Assistance' },
  { value: 'corporate', label: 'Corporate Services' },
  { value: 'fleet', label: 'Fleet Partnership' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' },
]

const inputClass =
  'w-full h-[52px] bg-[var(--black-warm)] border border-[var(--graphite)] rounded-[4px] px-4 text-[0.9375rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[rgba(var(--gold-rgb),0.15)] transition-[border,box-shadow] duration-200 disabled:opacity-60'

const labelClass =
  'block text-[0.75rem] font-medium tracking-[0.12em] uppercase text-[var(--text-muted)] mb-2'

export function ContactForm() {
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: 'general',
      message: '',
    },
  })

  const onSubmit = async (data: ContactFormValues) => {
    try {
      const result = await submitContactForm(data)
      if (result.success) {
        setIsSuccess(true)
        reset()
        toast.success(result.message)
      } else {
        toast.error(result.error || 'Something went wrong')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  if (isSuccess) {
    return (
      <div
        className="bg-[var(--charcoal)] border border-[var(--graphite)] rounded-[8px] p-8 md:p-10 flex flex-col items-center justify-center min-h-[400px] text-center"
        style={{ animation: 'contactFadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        <div className="w-14 h-14 rounded-full bg-[rgba(var(--gold-rgb),0.15)] flex items-center justify-center mb-5">
          <CheckCircle2 className="w-7 h-7 text-[var(--gold)]" />
        </div>
        <h2 className="text-[1.25rem] font-semibold text-[var(--text-primary)] mb-2 [text-wrap:balance]">
          Message received
        </h2>
        <p className="text-[0.9375rem] tracking-[0.01em] text-[var(--text-secondary)] max-w-sm mb-6 [text-wrap:pretty]">
          Our team will respond within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => setIsSuccess(false)}
          className="text-[0.875rem] font-medium text-[var(--gold-text)] hover:text-[var(--gold-text-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--charcoal)] rounded-[4px] px-5 py-3 transition-colors"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-[var(--charcoal)] border border-[var(--graphite)] rounded-[8px] p-8 md:p-10"
    >
      <h2 className="text-[1.25rem] font-semibold text-[var(--text-primary)] mb-1 [text-wrap:balance]">
        Send us a message
      </h2>
      <p className="text-[0.875rem] tracking-[0.01em] text-[var(--text-secondary)] mb-8 [text-wrap:pretty]">
        We read every message and respond promptly.
      </p>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="contact-name" className={labelClass}>
              Full Name <span className="text-[var(--gold-text)]">*</span>
            </label>
            <input
              id="contact-name"
              {...register('name')}
              autoComplete="name"
              className={inputClass}
              placeholder="Your full name"
              aria-invalid={errors.name ? 'true' : undefined}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" role="alert" className="text-[var(--error-text)] text-xs mt-1.5" style={{ animation: 'errorFadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                {errors.name.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="contact-email" className={labelClass}>
              Email Address <span className="text-[var(--gold-text)]">*</span>
            </label>
            <input
              id="contact-email"
              {...register('email')}
              type="email"
              autoComplete="email"
              className={inputClass}
              placeholder="your@email.com"
              aria-invalid={errors.email ? 'true' : undefined}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-[var(--error-text)] text-xs mt-1.5" style={{ animation: 'errorFadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="contact-phone" className={labelClass}>
              Phone Number
            </label>
            <input
              id="contact-phone"
              {...register('phone')}
              type="tel"
              autoComplete="tel"
              className={inputClass}
              placeholder="+971 50 123 4567"
            />
          </div>
          <div>
            <label htmlFor="contact-subject" className={labelClass}>
              Subject <span className="text-[var(--gold-text)]">*</span>
            </label>
            <div className="relative">
              <select
                id="contact-subject"
                {...register('subject')}
                className={`${inputClass} appearance-none cursor-pointer pr-10`}
                aria-invalid={errors.subject ? 'true' : undefined}
                aria-describedby={errors.subject ? 'subject-error' : undefined}
              >
                {subjectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            </div>
            {errors.subject && (
              <p id="subject-error" role="alert" className="text-[var(--error-text)] text-xs mt-1.5" style={{ animation: 'errorFadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                {errors.subject.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="contact-message" className={labelClass}>
            Message <span className="text-[var(--gold-text)]">*</span>
          </label>
          <textarea
            id="contact-message"
            {...register('message')}
            className={`${inputClass} h-auto min-h-[140px] py-3`}
            rows={5}
            placeholder="Tell us how we can help..."
            aria-invalid={errors.message ? 'true' : undefined}
            aria-describedby={errors.message ? 'message-error' : undefined}
          />
          {errors.message && (
            <p id="message-error" role="alert" className="text-[var(--error-text)] text-xs mt-1.5" style={{ animation: 'errorFadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1) both' }}>
              {errors.message.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-[52px] rounded-[4px] font-medium text-[0.875rem] tracking-[0.04em] uppercase bg-[var(--gold)] text-[var(--onyx)] hover:bg-[var(--gold-medium)] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-5px_rgba(198,170,136,0.15),0_4px_8px_-4px_rgba(198,170,136,0.1)] active:bg-[var(--gold-deep)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--charcoal)] transition-[color,background-color,transform,box-shadow] duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Message'
          )}
        </button>
      </div>
    </form>
  )
}
