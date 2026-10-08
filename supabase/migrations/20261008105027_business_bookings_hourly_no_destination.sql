-- Hourly hire has no destination (dropoff_address = 'As directed'), so
-- business_bookings.to_location_id must accept NULL, exactly as bookings.to_location_id
-- does on the customer side. Every other trip type still requires it, enforced by a check
-- so one-way, round-trip and multi-city rows keep the old guarantee.
ALTER TABLE public.business_bookings ALTER COLUMN to_location_id DROP NOT NULL;

ALTER TABLE public.business_bookings
  ADD CONSTRAINT business_bookings_destination_unless_hourly
    CHECK (trip_type = 'hourly' OR to_location_id IS NOT NULL);
