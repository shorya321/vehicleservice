-- Mirror of the migration applied via Supabase MCP (recorded version 20261113091532).
-- The checkout form has always asked for a flight number, but it was never stored.
-- Optional, so existing rows, inserts that omit it and booking-trash restores
-- (jsonb_populate_recordset over old snapshots) keep working unchanged.
alter table public.bookings
  add column if not exists flight_number text
  check (flight_number is null or (length(flight_number) between 2 and 20));
comment on column public.bookings.flight_number is
  'Customer-entered flight number (optional). Stored on the first journey of a trip.';
