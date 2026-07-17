-- Customer Booking: guest breakdown (adults / children / infants)
-- Date: 2026-07-17
-- Description: The customer flow captured a guest breakdown on the home-page search but discarded it:
--              the composition died at app/search/[routeSlug]/page.tsx and only a total ever reached
--              `bookings.passenger_count`. Nobody downstream learned a booking included an infant.
--              These columns let the breakdown reach the booking and the confirmation email, matching
--              what business_bookings already stores.
--
--              SEAT SEMANTICS (customer flow):
--                passenger_count = adults + children + infants
--              Every guest occupies a seat, INFANTS INCLUDED. UAE law requires a child safety seat
--              for under-4s and a restraint to age 10, and a child seat takes up a seat position, so
--              an infant cannot be counted as a lap passenger the way airlines do.
--
--              NOTE: 20260716_business_booking_guest_breakdown.sql's header describes the older
--              lap-infant model ("seated = adults + children"). That comment is stale history —
--              b104df7 changed the rule — and in any case the business and customer modules are
--              deliberately independent and free to diverge. Do not "reconcile" the two by editing
--              either. The customer rule is the one stated above, enforced by a zod refine in
--              app/checkout/actions.ts.
--
--              The <= 50 caps mirror the table's existing inline constraint
--              (20250116_create_booking_system.sql:44):
--                passenger_count INTEGER NOT NULL DEFAULT 1 CHECK (passenger_count > 0 AND passenger_count <= 50)
--              Without them `adults = 200, passenger_count = 50` would be representable.
--
--              No RPC section, unlike the business migration: `passenger_count` appears exactly once
--              in this table's SQL (the CREATE TABLE). No trigger, view, RLS policy or function
--              touches it — createBooking does a direct .insert(), so it is the only writer.
--
--              Backfill: existing rows get adults = passenger_count, children = 0, infants = 0, which
--              reconciles exactly with the legacy meaning of passenger_count (every row was adults).

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS adults   INTEGER NOT NULL DEFAULT 1 CHECK (adults   >= 1 AND adults   <= 50),
  ADD COLUMN IF NOT EXISTS children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0 AND children <= 50),
  ADD COLUMN IF NOT EXISTS infants  INTEGER NOT NULL DEFAULT 0 CHECK (infants  >= 0 AND infants  <= 50);

UPDATE bookings
   SET adults   = GREATEST(passenger_count, 1),
       children = 0,
       infants  = 0;
