/**
 * Request schema for creating a round trip, multi-city or hourly business booking.
 * SCOPE: Business module ONLY. One-way keeps `bookingCreationSchema` in ../validators.ts.
 */
import { z } from 'zod';
import { selectedAddonSchema } from '../validators';
import { BUSINESS_HOURLY_PACKAGES } from './types';
import { BUSINESS_MAX_LEGS_HARD_LIMIT } from './constants';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date');
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time');

export const businessTripLegSchema = z.object({
  from_location_id: z.string().uuid('Invalid location ID'),
  to_location_id: z.string().uuid('Invalid location ID'),
  pickup_address: z.string().trim().min(5, 'Pickup address required').max(300),
  dropoff_address: z.string().trim().min(5, 'Dropoff address required').max(300),
  date: isoDate,
  time: hhmm,
});

export const businessHourlyLegSchema = z.object({
  from_location_id: z.string().uuid('Invalid location ID'),
  pickup_address: z.string().trim().min(5, 'Pickup address required').max(300),
  date: isoDate,
  time: hhmm,
  hourly_package: z.enum(BUSINESS_HOURLY_PACKAGES),
});

const sharedFields = {
  customer_name: z.string().min(2, 'Customer name required').max(100),
  customer_email: z.string().email('Invalid customer email'),
  customer_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  vehicle_type_id: z.string().uuid('Invalid vehicle type ID'),
  passenger_count: z.number().int().min(1).max(20),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
  infants: z.number().int().min(0).max(20),
  customer_notes: z.string().max(500).optional(),
  reference_number: z.string().max(50).optional(),
  selected_addons: z.array(selectedAddonSchema).optional(),
  /** Signed trip fares after discount, before add-ons. */
  base_price: z.number().positive('Base price must be positive'),
  price_signature: z.string().min(1, 'Price signature required'),
  price_signature_timestamp: z.number().positive(),
  price_signature_nonce: z.string().min(1, 'Signature nonce required'),
};

export const businessTripCreationSchema = z
  .discriminatedUnion('trip_type', [
    z.object({
      trip_type: z.literal('round_trip'),
      legs: z.array(businessTripLegSchema).length(2),
      ...sharedFields,
    }),
    z.object({
      trip_type: z.literal('multi_city'),
      legs: z.array(businessTripLegSchema).min(2).max(BUSINESS_MAX_LEGS_HARD_LIMIT),
      ...sharedFields,
    }),
    z.object({
      trip_type: z.literal('hourly'),
      hourly: businessHourlyLegSchema,
      ...sharedFields,
    }),
  ])
  .refine((d) => d.passenger_count === d.adults + d.children + d.infants, {
    message: 'passenger_count must equal adults + children + infants',
    path: ['passenger_count'],
  });

export type BusinessTripCreationInput = z.infer<typeof businessTripCreationSchema>;
