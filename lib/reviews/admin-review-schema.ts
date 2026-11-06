import { z } from 'zod'
import { ADMIN_REVIEW_SOURCE_VALUES } from './sources'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .optional()
    .transform((value) => (value ? value : null))

/**
 * A review an admin enters from feedback a traveller gave outside the site.
 * `reviewDate` is the day the feedback was given, a calendar date in the
 * operating timezone; it cannot be in the future.
 */
export const adminReviewSchema = z.object({
  reviewerName: z.string().trim().min(1, 'Enter the traveller name').max(80, 'Keep the name under 80 characters'),
  rating: z.coerce.number().int().min(1, 'Pick a rating').max(5, 'Pick a rating'),
  reviewText: z
    .string()
    .trim()
    .min(10, 'Enter at least 10 characters of what they said')
    .max(1000, 'Keep the review under 1000 characters'),
  source: z.enum(ADMIN_REVIEW_SOURCE_VALUES, { errorMap: () => ({ message: 'Pick where the feedback came from' }) }),
  vehicleClass: optionalText(60),
  routeFrom: optionalText(120),
  routeTo: optionalText(120),
  reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
  publish: z.boolean(),
  isFeatured: z.boolean(),
})

export type AdminReviewInput = z.input<typeof adminReviewSchema>
export type AdminReviewData = z.output<typeof adminReviewSchema>
