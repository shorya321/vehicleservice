import { z } from 'zod'

export const siteSettingsSchema = z.object({
  brand_name: z.string().min(1, 'Brand name is required').max(100),
  header_logo_url: z.string().nullable(),
  footer_logo_url: z.string().nullable(),
  copyright_text: z.string().min(1, 'Copyright text is required').max(200),
  support_email: z.string().email('Invalid email address'),
  info_email: z.string().email('Invalid email address').or(z.literal('')),
  bookings_email: z.string().email('Invalid email address').or(z.literal('')),
  support_phone: z.string().min(1, 'Phone number is required').max(30),
  secondary_phone: z.string().max(30),
  office_address: z.string().max(300),
  social_links: z.object({
    instagram: z.string().url('Invalid URL').or(z.literal('')),
    facebook: z.string().url('Invalid URL').or(z.literal('')),
    twitter: z.string().url('Invalid URL').or(z.literal('')),
    linkedin: z.string().url('Invalid URL').or(z.literal('')),
    youtube: z.string().url('Invalid URL').or(z.literal('')),
    tiktok: z.string().url('Invalid URL').or(z.literal('')),
  }),
  maintenance_mode: z.boolean(),
  block_search_indexing: z.boolean(),
})

export type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>
