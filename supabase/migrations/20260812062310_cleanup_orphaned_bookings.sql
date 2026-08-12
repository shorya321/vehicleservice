-- Remove bookings whose customer was deleted before the delete path removed them.
--
-- bookings.customer_id -> profiles(id) is ON DELETE SET NULL, so every customer
-- an admin deleted left their trips behind with an empty customer: still listed
-- in Admin -> Bookings, still counted on the dashboard, with nothing left to say
-- whose booking it was. deleteUser()/bulkDeleteUsers() now delete these rows
-- before removing the auth user; this clears the ones already stranded.
--
-- A NULL customer_id can only mean an orphan. Checkout always stamps the
-- logged-in user (app/checkout/actions.ts), so there is no guest-booking flow
-- that would legitimately leave the column empty.
--
-- booking_passengers, booking_amenities, booking_assignments (and
-- resource_schedules through it) and reviews all cascade from bookings.id.

DELETE FROM public.bookings WHERE customer_id IS NULL;
