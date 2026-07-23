/**
 * Quotation validation schemas.
 *
 * Note the asymmetry with bookings: a quotation may be SAVED with only a customer name,
 * because an offline quote often starts from a phone call with nothing else known. Email and
 * phone only become mandatory at CONVERSION, where bookingCreationSchema requires them.
 * That gate lives in convert.ts — keeping it out of here is what lets a business start
 * quoting before they have the customer's details.
 */

import { z } from 'zod';
import { QUOTATION_STATUSES } from './status';

/** Same shape the booking path enforces, so a quotation can never hold an unbookable number. */
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

/** Optional free-text that should be treated as absent when blank. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));

export const quotationHeaderSchema = z.object({
  customer_name: z.string().trim().min(2, 'Customer name required').max(100),
  customer_company: optionalText(150),
  // Validated only when present — see the file header.
  customer_email: z
    .string()
    .trim()
    .email('Invalid customer email')
    .max(255)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  customer_phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Invalid phone number')
    .optional()
    .or(z.literal('').transform(() => undefined)),

  title: optionalText(150),
  notes: optionalText(2000),
  terms: optionalText(4000),

  valid_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
    .optional()
    .or(z.literal('').transform(() => undefined)),

  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, 'Invalid currency code')
    .default('AED'),

  // Bounds mirror the bq_markup_sane CHECK. Negative is allowed: a business may quote below
  // cost deliberately, and blocking it here would just push them to the manual override.
  default_markup_pct: z.number().min(-100).max(1000).default(0),

  discount_aed: z.number().min(0).default(0),
});

export type QuotationHeaderInput = z.infer<typeof quotationHeaderSchema>;

export const quotationAddonSchema = z.object({
  addon_id: z.string().uuid('Invalid addon ID'),
  name_snapshot: z.string().min(1).max(150),
  quantity: z.number().int().min(1).max(10),
  unit_price: z.number().min(0),
  total_price: z.number().min(0),
});

export const quotationTripSchema = z
  .object({
    id: z.string().uuid().optional(),
    sort_order: z.number().int().min(0).default(0),

    from_location_id: z.string().uuid('Invalid pickup location'),
    to_location_id: z.string().uuid('Invalid dropoff location'),
    pickup_address: z.string().trim().min(5, 'Pickup address required').max(500),
    dropoff_address: z.string().trim().min(5, 'Dropoff address required').max(500),

    // Nullable: an undated quote is legitimate. The UI flags it as non-convertible up front
    // rather than letting the business discover it at conversion.
    //
    // `offset: true` is REQUIRED, not cosmetic. PostgREST returns timestamptz as
    // "2026-08-15T04:30:00+00:00", and bare z.string().datetime() accepts only a "Z" suffix —
    // so re-saving any quotation that already had a dated trip failed with
    // "Invalid datetime format". Creating worked (the client sends toISOString()), which is
    // why this only ever bit on EDIT.
    pickup_datetime: z
      .string()
      .datetime({ offset: true, message: 'Invalid datetime format' })
      .nullable()
      .default(null),

    vehicle_type_id: z.string().uuid('Invalid vehicle type'),

    passenger_count: z.number().int().min(1).max(20),
    adults: z.number().int().min(1).max(20),
    children: z.number().int().min(0).max(20),
    infants: z.number().int().min(0).max(20),

    description: optionalText(300).nullable().default(null),
    addons: z.array(quotationAddonSchema).max(20).default([]),

    net_base_price_aed: z.number().min(0),
    net_addons_price_aed: z.number().min(0).default(0),
    net_total_aed: z.number().min(0),
    sell_total_aed: z.number().min(0),

    price_mode: z.enum(['inherited', 'markup', 'manual']).default('inherited'),
    markup_percent: z.number().min(-100).max(1000).nullable().default(null),
  })
  // Mirrors the bqi_pax_consistent CHECK and the identical .refine() on
  // bookingCreationSchema. Every guest occupies a seat, infants included — UAE law requires
  // a child safety seat for under-4s and that seat takes a position.
  .refine((d) => d.passenger_count === d.adults + d.children + d.infants, {
    message: 'passenger_count must equal adults + children + infants',
    path: ['passenger_count'],
  })
  .refine((d) => d.from_location_id !== d.to_location_id, {
    message: 'Pickup and dropoff must be different locations',
    path: ['to_location_id'],
  })
  // Mirrors bqi_price_mode: only a pinned line carries its own percentage.
  .refine(
    (d) =>
      d.price_mode === 'markup' ? d.markup_percent !== null : d.markup_percent === null,
    {
      message: 'markup_percent is required for a pinned line and must be absent otherwise',
      path: ['markup_percent'],
    }
  );

export type QuotationTripInput = z.infer<typeof quotationTripSchema>;

export const quotationFiltersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum([...QUOTATION_STATUSES, 'all', 'expired']).default('all'),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type QuotationFiltersInput = z.infer<typeof quotationFiltersSchema>;

export const quotationStatusChangeSchema = z.object({
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']),
});

/**
 * Conversion request. The token binds the confirmation to the exact figures the user was
 * shown — without it, a bare boolean would let prices move between the diff and the confirm,
 * and the business would buy at a price they never saw.
 */
export const quotationConvertSchema = z.object({
  repriceToken: z.string().min(1, 'Repricing token required'),
  acceptRepricing: z.boolean().default(false),
});

/** Returns the first readable message from a ZodError, matching the vendor module's helper. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input';
}
