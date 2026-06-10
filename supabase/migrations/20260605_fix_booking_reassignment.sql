-- Fix: Add unique index on business_booking_id for active assignments
-- Customer bookings already have idx_booking_assignments_active on (booking_id)
-- but business bookings were missing this constraint, allowing duplicate active assignments.

CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_assignments_business_active
ON booking_assignments(business_booking_id)
WHERE status IN ('pending', 'accepted');
