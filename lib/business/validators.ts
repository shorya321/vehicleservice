/**
 * Validation Schemas for B2B Business Accounts
 * Uses Zod for runtime type validation
 */

import { z } from 'zod';

/**
 * Business Registration Schema
 */
export const businessRegistrationSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  business_email: z.string().email('Invalid email address'),
  business_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  contact_person_name: z.string().min(2).max(100),
  address: z.string().optional(),
  city: z.string().optional(),
  country_code: z.string().length(2).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type BusinessRegistrationInput = z.infer<typeof businessRegistrationSchema>;

/**
 * Booking Creation Schema
 */
export const bookingCreationSchema = z.object({
  customer_name: z.string().min(2, 'Customer name required').max(100),
  customer_email: z.string().email('Invalid customer email'),
  customer_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  from_location_id: z.string().uuid('Invalid location ID'),
  to_location_id: z.string().uuid('Invalid location ID'),
  pickup_address: z.string().min(5, 'Pickup address required'),
  dropoff_address: z.string().min(5, 'Dropoff address required'),
  pickup_datetime: z.string().datetime('Invalid datetime format'),
  vehicle_type_id: z.string().uuid('Invalid vehicle type ID'),
  passenger_count: z.number().int().min(1).max(20),
  luggage_count: z.number().int().min(0).max(50),
  base_price: z.number().positive('Base price must be positive'),
  amenities_price: z.number().min(0, 'Amenities price cannot be negative'),
  total_price: z.number().positive('Total price must be positive'),
  customer_notes: z.string().max(500).optional(),
  reference_number: z.string().max(50).optional(),
});

export type BookingCreationInput = z.infer<typeof bookingCreationSchema>;

/**
 * Custom Domain Schema
 */
export const customDomainSchema = z.object({
  custom_domain: z
    .string()
    .min(4, 'Domain too short')
    .max(253, 'Domain too long')
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
      'Invalid domain format'
    ),
});

export type CustomDomainInput = z.infer<typeof customDomainSchema>;

/**
 * Wallet Recharge Schema
 */
export const walletRechargeSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(10, 'Minimum recharge amount is $10')
    .max(10000, 'Maximum recharge amount is $10,000'),
  currency: z.string().optional().default('usd'),
});

export type WalletRechargeInput = z.infer<typeof walletRechargeSchema>;

/**
 * Admin Credit Adjustment Schema
 */
export const adminCreditAdjustmentSchema = z.object({
  amount: z.number().refine((val) => val !== 0, 'Amount cannot be zero'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(200),
});

export type AdminCreditAdjustmentInput = z.infer<typeof adminCreditAdjustmentSchema>;

/**
 * Booking Cancellation Schema
 */
export const bookingCancellationSchema = z.object({
  cancellation_reason: z.string().min(10, 'Please provide a reason (minimum 10 characters)').max(500),
});

export type BookingCancellationInput = z.infer<typeof bookingCancellationSchema>;

/**
 * Business Profile Update Schema
 */
export const businessProfileUpdateSchema = z.object({
  business_name: z.string().min(2).max(100).optional(),
  business_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  contact_person_name: z.string().min(2).max(100).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country_code: z.string().length(2).optional(),
});

export type BusinessProfileUpdateInput = z.infer<typeof businessProfileUpdateSchema>;

/**
 * Pagination Schema
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Booking Filter Schema
 */
export const bookingFilterSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled', 'refunded']).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  search: z.string().optional(), // Search in booking number or customer name
});

export type BookingFilterInput = z.infer<typeof bookingFilterSchema>;

/**
 * Transaction Filter Schema
 */
export const transactionFilterSchema = z.object({
  transaction_type: z.enum(['credit_added', 'booking_deduction', 'refund', 'admin_adjustment']).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
});

export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;

/**
 * Business Status Update Schema (Admin)
 */
export const businessStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended', 'inactive', 'rejected']),
});

export type BusinessStatusInput = z.infer<typeof businessStatusSchema>;

/**
 * Hex Color Schema - reusable validation for hex colors
 */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format (e.g., #3b82f6)');

/**
 * Theme Mode Colors Schema (for dark or light mode)
 */
export const themeModeColorsSchema = z.object({
  background: hexColorSchema.optional(),
  surface: hexColorSchema.optional(),
  card: hexColorSchema.optional(),
  sidebar: hexColorSchema.optional(),
  text_primary: hexColorSchema.optional(),
  text_secondary: hexColorSchema.optional(),
  border: hexColorSchema.optional(),
});

/**
 * Theme Accent Colors Schema
 */
export const themeAccentColorsSchema = z.object({
  primary: hexColorSchema.optional(),
  secondary: hexColorSchema.optional(),
  tertiary: hexColorSchema.optional(),
});

/**
 * ThemeConfig Schema - matches database JSONB structure
 */
export const themeConfigSchema = z.object({
  accent: themeAccentColorsSchema.optional(),
  dark: themeModeColorsSchema.optional(),
  light: themeModeColorsSchema.optional(),
  _version: z.number().optional(),
});

export type ThemeConfigInput = z.infer<typeof themeConfigSchema>;

/**
 * Branding Settings Schema
 * Uses theme_config JSONB structure for all colors
 */
export const brandingSettingsSchema = z.object({
  // Brand Identity (separate columns)
  brand_name: z.string().min(2, 'Brand name must be at least 2 characters').max(100).optional(),

  // Theme Configuration (JSONB column)
  theme_config: themeConfigSchema.optional(),
});

export type BrandingSettingsInput = z.infer<typeof brandingSettingsSchema>;

/**
 * Logo Upload Schema
 */
export const logoUploadSchema = z.object({
  file_name: z.string().min(1, 'File name required'),
  file_size: z.number().positive().max(2097152, 'File size must not exceed 2MB'),
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'], {
    errorMap: () => ({ message: 'Only JPEG, PNG, WebP, and SVG images are allowed' }),
  }),
});

export type LogoUploadInput = z.infer<typeof logoUploadSchema>;
