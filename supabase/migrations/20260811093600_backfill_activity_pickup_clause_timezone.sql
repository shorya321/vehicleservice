-- Re-render the frozen pickup strings in the operating timezone.
--
-- These were written by to_char() with no zone, so they read four hours early
-- and are shown to owners verbatim in the activity feed. Every affected row
-- also carries the raw instant in metadata.pickup_at, so this rebuilds from
-- that rather than trying to parse and shift the existing text.
--
-- Idempotent by construction: the result is a pure function of pickup_at, so
-- re-running changes nothing. Rows without pickup_at are skipped rather than
-- guessed at.
update business_activity_logs
set metadata = jsonb_set(
      metadata,
      '{pickup_clause}',
      to_jsonb(
        ' for ' || to_char(
          (metadata ->> 'pickup_at')::timestamptz AT TIME ZONE platform_timezone(),
          'DD Mon YYYY at HH24:MI'
        )
      )
    )
where metadata ? 'pickup_clause'
  and metadata ? 'pickup_at'
  -- Only where it is actually wrong, so a re-run is a no-op rather than a churn.
  and metadata ->> 'pickup_clause' is distinct from (
        ' for ' || to_char(
          (metadata ->> 'pickup_at')::timestamptz AT TIME ZONE platform_timezone(),
          'DD Mon YYYY at HH24:MI'
        )
      );
