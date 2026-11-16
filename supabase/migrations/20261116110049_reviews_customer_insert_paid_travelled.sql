-- Mirror of the migration applied via Supabase MCP (recorded version 20261116110049).
-- Customers review a trip they own, paid for and have travelled.
-- booking_status rarely reaches 'completed', so travelled = pickup in the past.
-- Mirrors lib/reviews/eligibility.ts. Also pins new customer reviews to pending
-- and not featured, so moderation cannot be skipped through the API.
DROP POLICY IF EXISTS "Customers can create reviews for own bookings" ON public.reviews;

CREATE POLICY "Customers can create reviews for own bookings"
ON public.reviews
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = customer_id
  AND source = 'customer'
  AND status = 'pending'::review_status
  AND is_featured IS NOT TRUE
  AND EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = reviews.booking_id
      AND b.customer_id = auth.uid()
      AND b.booking_status <> 'cancelled'
      AND b.payment_status = 'completed'
      AND b.pickup_datetime < now()
      AND (b.booking_group_id IS NULL OR b.leg_index = 0)
  )
);
