import * as z from "zod"

// Personal Info Schema
export const personalInfoSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_country: z.string().optional(),
})

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>

// Password Change Schema
export const passwordChangeSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>

// Account Deletion Request Schema
export const deletionRequestSchema = z.object({
  reason: z.string().min(10, "Please provide a reason (at least 10 characters)"),
  confirm: z.literal(true, {
    errorMap: () => ({ message: "You must confirm this action" }),
  }),
})

export type DeletionRequestFormData = z.infer<typeof deletionRequestSchema>

// Notification Preferences Schema
export const notificationPreferencesSchema = z.object({
  email_booking_updates: z.boolean(),
  email_payment_alerts: z.boolean(),
  email_security_alerts: z.boolean(),
  email_system_updates: z.boolean(),
})

export type NotificationPreferencesFormData = z.infer<typeof notificationPreferencesSchema>

// Review Schema
export const reviewSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  rating: z.number().min(1).max(5),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  content: z.string().min(10, "Review must be at least 10 characters").max(2000),
})

export type ReviewFormData = z.infer<typeof reviewSchema>

// Booking Filters Schema
export const bookingFiltersSchema = z.object({
  search: z.string().optional(),
  booking_status: z.enum(["all", "confirmed", "completed", "cancelled", "pending"]).optional(),
  payment_status: z.enum(["all", "completed", "processing", "failed", "refunded"]).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.number().default(1),
})

export type BookingFiltersData = z.infer<typeof bookingFiltersSchema>

// Review Filters Schema
export const reviewFiltersSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).optional(),
  status: z.enum(["all", "pending", "approved"]).optional(),
  rating: z.enum(["all", "5", "4-5", "1-3"]).optional(),
  page: z.number().default(1),
})

export type ReviewFiltersData = z.infer<typeof reviewFiltersSchema>
