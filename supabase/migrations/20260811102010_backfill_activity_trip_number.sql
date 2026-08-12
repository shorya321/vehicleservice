-- Backfill the trip number onto activity rows written before
-- 20260811120000_activity_trip_number_label, so the feed does not read as two
-- different identifier schemes either side of the deploy.
--
-- Only rows whose booking still exists can be resolved. Rows for hard-deleted
-- bookings keep the booking number they were written with, which is the correct
-- outcome: the snapshot is all that is left of them.
--
-- Reversible on purpose. The old label is moved into metadata.booking_number
-- before being overwritten, so the inverse restores it exactly:
--
--   UPDATE business_activity_logs
--   SET entity_label = metadata->>'booking_number',
--       metadata = metadata - 'booking_number'
--   WHERE entity_type = 'business_booking' AND metadata ? 'booking_number';

UPDATE public.business_activity_logs l
SET entity_label = bb.trip_number,
    metadata = COALESCE(l.metadata, '{}'::jsonb)
               || jsonb_build_object('booking_number', l.entity_label)
FROM public.business_bookings bb
WHERE l.entity_type = 'business_booking'
  AND l.entity_id = bb.id
  AND bb.trip_number IS NOT NULL
  AND l.entity_label IS NOT NULL
  AND l.entity_label IS DISTINCT FROM bb.trip_number;
