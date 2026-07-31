-- Vendor-controlled hold duration for online bookings.
--
-- Until now a booking held its vehicle + driver for a hard-coded 2h from pickup
-- (ESTIMATED_TRIP_DURATION_MS in lib/availability/service.ts). Vendors need to say how
-- long the resources are really tied up, so the number moves onto the assignment row.
--
-- Nullable with no DEFAULT on purpose: NULL means "never accepted", so the admin path
-- that creates assignments keeps inserting unchanged.

ALTER TABLE public.booking_assignments
  ADD COLUMN IF NOT EXISTS estimated_duration_hours integer;

-- Freeze history: every already-accepted assignment was held for the old fixed 2h, and the
-- availability calendar redraws past trips from this column. Backfilling keeps those blocks
-- exactly the length they were originally booked at.
UPDATE public.booking_assignments
   SET estimated_duration_hours = 2
 WHERE estimated_duration_hours IS NULL
   AND accepted_at IS NOT NULL;

ALTER TABLE public.booking_assignments
  DROP CONSTRAINT IF EXISTS booking_assignments_estimated_duration_hours_check;

ALTER TABLE public.booking_assignments
  ADD CONSTRAINT booking_assignments_estimated_duration_hours_check
  CHECK (estimated_duration_hours IS NULL
         OR estimated_duration_hours BETWEEN 1 AND 24);

COMMENT ON COLUMN public.booking_assignments.estimated_duration_hours IS
  'Hours the vehicle and driver are held from pickup. Written when the vendor accepts and whenever the vendor changes the duration. NULL means the assignment was never accepted. Legacy accepted rows were backfilled to 2, the old hard-coded estimate.';
