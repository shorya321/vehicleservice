import * as z from "zod"

/**
 * The one place a vendor application field is declared required or optional.
 *
 * Every surface that writes an application parses this: the create form, the create
 * action, the edit form and the edit action. It was previously copied into all four,
 * which is how business_email came to be optional while approve and reject both mail
 * the applicant at that address.
 */
export const vendorApplicationSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  // Required because the approval and rejection emails are addressed here.
  businessEmail: z.string().email("Please enter a valid email"),
  businessPhone: z.string().min(6, "Please enter a valid phone number"),
  businessAddress: z.string().min(1, "Business address is required"),
  businessCity: z.string().min(1, "City is required"),
  businessCountryCode: z.string().default("AE"),
  businessDescription: z.string().optional(),
  registrationNumber: z.string().min(1, "Business registration number is required"),
  tradeLicenseNumber: z.string().min(1, "Trade license number is required"),
  tradeLicenseExpiry: z.string().min(1, "Trade license expiry date is required"),
  insurancePolicyNumber: z.string().min(1, "Insurance policy number is required"),
  insuranceExpiry: z.string().min(1, "Insurance expiry date is required"),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
})

export type VendorApplicationFormData = z.infer<typeof vendorApplicationSchema>
