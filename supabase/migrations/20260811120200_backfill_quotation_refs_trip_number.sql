-- The quotation.converted row lists the bookings a conversion created in
-- metadata.refs, rendered as the REFERENCES block when the row is expanded.
-- Those refs were written as booking numbers, so after
-- 20260811120100_backfill_activity_trip_number the same booking appeared as a
-- trip number in the feed sentence and as a booking number in that list.
--
-- Only the refs key is rewritten. The double COALESCE means a ref whose booking
-- no longer exists keeps its booking number, and a row where nothing resolves
-- keeps its original array untouched.
--
-- Reversible by swapping the join and the projection:
--   ... COALESCE(bb.booking_number, ref.value #>> '{}') ...
--   ... LEFT JOIN business_bookings bb ON bb.trip_number = ref.value #>> '{}'

UPDATE public.business_activity_logs l
SET metadata = jsonb_set(
      l.metadata,
      '{refs}',
      (SELECT COALESCE(
                jsonb_agg(COALESCE(bb.trip_number, ref.value #>> '{}')),
                l.metadata->'refs'
              )
       FROM jsonb_array_elements(l.metadata->'refs') AS ref
       LEFT JOIN public.business_bookings bb
         ON bb.booking_number = ref.value #>> '{}')
    )
WHERE l.action = 'quotation.converted'
  AND l.metadata ? 'refs'
  AND jsonb_array_length(l.metadata->'refs') > 0;
