'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Send } from 'lucide-react'
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
        setTimeout(() => setIsSuccess(false), 5000)
      } else {
        toast.error(result.error || 'Something went wrong')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  if (isSuccess) {
    return (
      <div className="luxury-card p-8 md:p-10 flex flex-col items-center justify-center min-h-[400px] text-center">
        <div
          className="w-16 h-16 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mb-6"
          style={{ animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          <CheckCircle2 className="w-8 h-8 text-[var(--gold)]" />
        </div>
        <h3 className="text-xl font-serif text-[var(--text-primary)] mb-3">
          Message Sent Successfully
        </h3>
        <p className="text-[var(--text-secondary)] max-w-sm">
          Thank you for reaching out. Our team will review your message and
          respond within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="luxury-card p-8 md:p-10">
      <h3 className="text-xl font-serif text-[var(--text-primary)] mb-1">
        Send Us a Message
      </h3>
      <p className="text-sm text-[var(--text-muted)] mb-8">
        Fill in the form below and we&apos;ll get back to you promptly.
      </p>

      <div className="space-y-5">
        {/* Name & Email row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Full Name <span className="text-[var(--gold)]">*</span>
            </label>
            <input
              {...register('name')}
              className="luxury-input"
              placeholder="Your full name"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Email Address <span className="text-[var(--gold)]">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              className="luxury-input"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Phone & Subject row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Phone Number
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="luxury-input"
              placeholder="+971 50 123 4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Subject <span className="text-[var(--gold)]">*</span>
            </label>
            <select
              {...register('subject')}
              className="luxury-input appearance-none cursor-pointer"
            >
              {subjectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.subject && (
              <p className="text-red-400 text-xs mt-1.5">{errors.subject.message}</p>
            )}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Message <span className="text-[var(--gold)]">*</span>
          </label>
          <textarea
            {...register('message')}
            className="luxury-input"
            rows={5}
            placeholder="Tell us how we can help you..."
          />
          {errors.message && (
            <p className="text-red-400 text-xs mt-1.5">{errors.message.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 rounded-xl font-medium text-sm tracking-wide uppercase bg-gradient-to-r from-[#C6AA88] to-[#A68B5B] text-[var(--black-void)] hover:shadow-[0_0_30px_rgba(198,170,136,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message
            </>
          )}
        </button>
      </div>
    </form>
  )
}
