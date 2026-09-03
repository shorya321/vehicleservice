import * as z from "zod"
import { vendorApplicationSchema } from "@/app/vendor-application/schemas"
import { bookingTodayAsCalendarDate } from "@/lib/utils/timezone"

// Judged against the operating timezone, not the applicant browser: an expiry is a fact
// about the document, not about where it is read.
const isFutureDate = (date: string): boolean =>
  Boolean(date) && new Date(date) > bookingTodayAsCalendarDate()

/**
 * The shared schema owns which fields are required; the create form adds only the two
 * checks that cannot apply on the edit path, where a document may already have expired.
 *
 * Hoisted out of the form component so the three section components can type their
 * `form` prop against it without importing the component that renders them.
 */
export const createApplicationSchema = vendorApplicationSchema.extend({
  tradeLicenseExpiry: z
    .string()
    .min(1, "Trade license expiry date is required")
    .refine(isFutureDate, "Trade license expiry date must be in the future"),
  insuranceExpiry: z
    .string()
    .min(1, "Insurance expiry date is required")
    .refine(isFutureDate, "Insurance expiry date must be in the future"),
})

/**
 * `businessCountryCode` is `z.string().default("AE")`, so the schema's input and output
 * types genuinely differ: `string | undefined` going in, `string` coming out. The form
 * used to be typed on the output alone, which is what made `zodResolver` unassignable
 * and left `handleSubmit` inferring a bare `FieldValues`. Field values are inputs and
 * the submit handler receives the parsed output, so both are named here and the form
 * is parameterised on the pair.
 */
export type VendorApplicationFormInput = z.input<typeof createApplicationSchema>
export type VendorApplicationFormValues = z.output<typeof createApplicationSchema>
