import * as z from "zod"

export const vendorApplicationSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  businessPhone: z.string().min(6, "Please enter a valid phone number").optional().or(z.literal("")),
  businessAddress: z.string().optional(),
  businessCity: z.string().optional(),
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
