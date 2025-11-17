/**
 * Add Business Booking Support to Booking Assignments
 *
 * This migration enables the booking_assignments table to handle both customer
 * and business bookings through a polymorphic association pattern.
 *
 * Key Changes:
 * 1. Add business_booking_id column (mutually exclusive with booking_id)
 * 2. Add CHECK constraint to ensure exactly ONE booking type is referenced
 * 3. Add performance index for business booking lookups
 *
 * Why Polymorphic Pattern:
 * - Vendors see unified list (don't know booking source)
 * - Zero code duplication in vendor logic
 * - Same assignment workflow for both types
 * - Extensible for future booking types
 */

-- Add polymorphic reference to business_bookings
ALTER TABLE booking_assignments
ADD COLUMN business_booking_id UUID REFERENCES business_bookings(id) ON DELETE CASCADE;

-- Ensure exactly ONE booking type is referenced (prevents invalid states)
ALTER TABLE booking_assignments
ADD CONSTRAINT booking_assignments_one_booking_type
  CHECK (
    (booking_id IS NOT NULL AND business_booking_id IS NULL) OR
    (booking_id IS NULL AND business_booking_id IS NOT NULL)
  );

-- Create index for fast business booking assignment lookups
CREATE INDEX idx_booking_assignments_business ON booking_assignments(business_booking_id);

-- Create index for vendor queries (lookup assignments by vendor and status)
CREATE INDEX idx_booking_assignments_vendor_status ON booking_assignments(vendor_id, status)
WHERE status IN ('pending', 'accepted');

-- Add comments for documentation
COMMENT ON COLUMN booking_assignments.business_booking_id IS 'References business_bookings table. Mutually exclusive with booking_id. Enables unified vendor assignment workflow for both customer and business bookings.';

COMMENT ON CONSTRAINT booking_assignments_one_booking_type ON booking_assignments IS 'Ensures exactly one booking type is referenced (either booking_id OR business_booking_id, never both or neither). This maintains data integrity for the polymorphic association pattern.';
