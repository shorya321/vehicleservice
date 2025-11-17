import { z } from 'zod'

// Review submission schema
export const reviewFormSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  rating: z
    .number()
    .min(1, 'Please select a rating')
    .max(5, 'Rating must be between 1 and 5'),
  reviewText: z
    .string()
    .max(1000, 'Review must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  photos: z
    .array(z.string().url('Invalid photo URL'))
    .max(5, 'Maximum 5 photos allowed')
    .optional()
    .default([]),
})

export type ReviewFormData = z.infer<typeof reviewFormSchema>

// Admin response schema
export const adminResponseSchema = z.object({
  reviewId: z.string().uuid('Invalid review ID'),
  response: z
    .string()
    .min(1, 'Response cannot be empty')
    .max(500, 'Response must be less than 500 characters'),
})

export type AdminResponseData = z.infer<typeof adminResponseSchema>

// Review filters schema (for public and admin review lists)
export const reviewFiltersSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'all']).optional(),
  rating: z.number().min(1).max(5).optional(),
  ratingRange: z.enum(['all', '5', '4-5', '1-3']).optional(),
  sortBy: z.enum(['newest', 'oldest', 'highest', 'lowest']).optional().default('newest'),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
})

export type ReviewFilters = z.infer<typeof reviewFiltersSchema>

// Photo upload validation
export const photoUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Invalid file' }),
  reviewId: z.string().uuid('Invalid review ID').optional(),
})

export type PhotoUploadData = z.infer<typeof photoUploadSchema>

// Validate file before upload
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must be less than 5MB' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' }
  }

  return { valid: true }
}
