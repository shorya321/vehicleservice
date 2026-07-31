-- Cancelling a booking must also close its vendor assignment.
--
-- Until now only the *completed* branch of the admin status update wrote to
-- booking_assignments. Cancelling left the row at 'accepted' with cancelled_at NULL, so the
-- job read as live: green ("it ran") on the vendor availability calendar, filed under
-- "Upcoming" in the vendor pipeline, and in three of the four cancel paths the vehicle and
-- driver were never released from resource_schedules at all.
--
-- The application fix routes every cancel path through closeActiveAssignments()
-- (lib/bookings/unified-service.ts). This migration cleans up the rows that already
-- drifted, and catches the migration history up to the live schema.

-- ---------------------------------------------------------------------------
-- PART 1: schema catch-up
-- ---------------------------------------------------------------------------
-- The app has written booking_assignments.completed_at and status='completed' for a long
-- time, but no migration ever added the column or widened the CHECK — the live database was
-- changed out of band. A fresh environment built from this directory would break on the
-- first completed booking. Both statements are idempotent.

ALTER TABLE public.booking_assignments
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.booking_assignments
  DROP CONSTRAINT IF EXISTS booking_assignments_status_check;

ALTER TABLE public.booking_assignments
  ADD CONSTRAINT booking_assignments_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed'));

-- ---------------------------------------------------------------------------
-- PART 2: backfill assignments left open on cancelled bookings
-- ---------------------------------------------------------------------------
-- The notification trigger is disabled for the backfill only. Without this, every historical
-- cancellation would fire a fresh "Assignment Cancelled" notification at the vendor — months
-- of dead bookings landing in their bell at once.
--
-- Only this one trigger needs disabling: the other six on the table key on
-- 'accepted' / 'pending' / 'rejected', or on driver_id / vehicle_id changing, none of which
-- this UPDATE does.

ALTER TABLE public.booking_assignments
  DISABLE TRIGGER trigger_notify_vendor_assignment_cancelled;

UPDATE public.booking_assignments ba
   SET status = 'cancelled',
       cancelled_at = COALESCE(src.booking_cancelled_at, now()),
       cancellation_reason = COALESCE(ba.cancellation_reason, 'Backfill: booking was cancelled'),
       updated_at = now()
  FROM (
    SELECT a.id AS assignment_id,
           COALESCE(b.cancelled_at, bb.cancelled_at) AS booking_cancelled_at
      FROM public.booking_assignments a
      LEFT JOIN public.bookings b ON b.id = a.booking_id
      LEFT JOIN public.business_bookings bb ON bb.id = a.business_booking_id
     WHERE a.status IN ('pending', 'accepted')
       AND COALESCE(b.booking_status, bb.booking_status) = 'cancelled'
  ) AS src
 WHERE ba.id = src.assignment_id;

ALTER TABLE public.booking_assignments
  ENABLE TRIGGER trigger_notify_vendor_assignment_cancelled;

-- ---------------------------------------------------------------------------
-- PART 3: release the holds those bookings were still occupying
-- ---------------------------------------------------------------------------
-- resource_schedules is the table that makes a vehicle and driver read as unavailable.
-- A cancelled or completed booking must hold nothing.

DELETE FROM public.resource_schedules rs
 USING public.booking_assignments ba
  LEFT JOIN public.bookings b ON b.id = ba.booking_id
  LEFT JOIN public.business_bookings bb ON bb.id = ba.business_booking_id
 WHERE rs.booking_assignment_id = ba.id
   AND COALESCE(b.booking_status, bb.booking_status) IN ('cancelled', 'completed');
