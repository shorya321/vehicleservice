-- Reviews an admin enters on a traveller's behalf: feedback received outside the
-- site (WhatsApp, email, phone, Google, in person). Such a review has no customer
-- account or booking behind it, so both become optional, and the row records who
-- the reviewer was and where the feedback came from.

ALTER TABLE public.reviews
  ALTER COLUMN customer_id DROP NOT NULL,
  ALTER COLUMN booking_id DROP NOT NULL;

ALTER TABLE public.reviews
  ADD COLUMN source text NOT NULL DEFAULT 'customer'
    CONSTRAINT reviews_source_check
    CHECK (source IN ('customer', 'whatsapp', 'email', 'phone', 'google', 'in_person', 'other')),
  ADD COLUMN reviewer_name text
    CONSTRAINT reviews_reviewer_name_check
    CHECK (reviewer_name IS NULL OR char_length(btrim(reviewer_name)) BETWEEN 1 AND 80),
  ADD COLUMN added_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- A customer review always has its account and booking; an admin-entered one
-- always names the reviewer. Existing rows are all 'customer' with both set.
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_source_shape CHECK (
    (source = 'customer' AND customer_id IS NOT NULL AND booking_id IS NOT NULL)
    OR (source <> 'customer' AND reviewer_name IS NOT NULL)
  );

COMMENT ON COLUMN public.reviews.source IS
  'customer = left by the traveller on the site; anything else = entered by an admin from feedback received that way.';
COMMENT ON COLUMN public.reviews.reviewer_name IS
  'Reviewer as the admin entered it. Only for admin-entered reviews; customer reviews take the name from profiles.';

-- Admins may add reviews, but only admin-entered ones: a customer review is
-- created by the customer.
CREATE POLICY "Admins can add reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (
    source <> 'customer'
    AND added_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

-- Customers may not dress their own review up as admin-entered.
DROP POLICY "Customers can update own pending reviews" ON public.reviews;
CREATE POLICY "Customers can update own pending reviews"
  ON public.reviews FOR UPDATE
  USING ((auth.uid() = customer_id) AND (status = 'pending'::review_status))
  WITH CHECK ((auth.uid() = customer_id) AND (status = 'pending'::review_status) AND (source = 'customer'));

-- The "new review" alert is for reviews customers submit, not for ones an admin
-- just typed in.
CREATE OR REPLACE FUNCTION public.notify_new_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  customer_name TEXT;
BEGIN
  IF current_setting('app.restoring_booking', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.source <> 'customer' THEN
    RETURN NEW;
  END IF;

  customer_name := (
    SELECT COALESCE(full_name, email, 'A customer')
    FROM profiles
    WHERE id = NEW.customer_id
    LIMIT 1
  );

  IF customer_name IS NULL THEN
    customer_name := 'A customer';
  END IF;

  PERFORM create_admin_notification(
    'review'::notification_category,
    'review_submitted',
    'New Review Submitted',
    customer_name || ' submitted a ' || NEW.rating || '-star review',
    jsonb_build_object(
      'review_id', NEW.id,
      'customer_id', NEW.customer_id,
      'rating', NEW.rating
    ),
    '/admin/reviews'
  );
  RETURN NEW;
END;
$function$;
