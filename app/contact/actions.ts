'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  sendContactConfirmationEmail,
  sendContactAdminNotificationEmail,
} from '@/lib/email/services/contact-emails'
import { getAdminEmail } from '@/lib/email/config'

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional().or(z.literal('')),
  subject: z.enum(['general', 'booking', 'corporate', 'fleet', 'feedback', 'other']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be under 2000 characters'),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

export async function submitContactForm(data: ContactFormData) {
  // Validate input
  const parsed = contactFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const supabase = await createClient()

  // Rate limiting: check for recent submissions from same email
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('contact_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('email', parsed.data.email)
    .gte('created_at', fiveMinutesAgo)

  if (count && count >= 3) {
    return {
      success: false,
      error: 'You have submitted too many messages recently. Please wait a few minutes.',
    }
  }

  // Insert submission
  const { data: submission, error } = await supabase
    .from('contact_submissions')
    .insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject,
      message: parsed.data.message,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[Contact] Error inserting submission:', error)
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  // Send emails in background (don't block the response)
  try {
    const adminEmail = getAdminEmail()
    await Promise.allSettled([
      sendContactConfirmationEmail({
        email: parsed.data.email,
        name: parsed.data.name,
        subject: parsed.data.subject,
        message: parsed.data.message,
      }),
      sendContactAdminNotificationEmail({
        adminEmail,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        subject: parsed.data.subject,
        message: parsed.data.message,
        submissionId: submission.id,
      }),
    ])
  } catch (emailError) {
    // Don't fail the form submission if email fails
    console.error('[Contact] Email notification error:', emailError)
  }

  return {
    success: true,
    message: 'Your message has been sent successfully. We will get back to you soon.',
  }
}
