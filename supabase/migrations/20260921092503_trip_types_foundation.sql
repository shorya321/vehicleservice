-- Trip types: one way, round trip, multi-city, hourly (half day / full day).
-- Round trip and multi-city are N ordinary bookings rows (one per leg) tied by booking_groups,
-- which is the payable unit (one Stripe PaymentIntent). Hourly is a single bookings row.

CREATE TABLE public.booking_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  trip_type text NOT NULL CHECK (trip_type IN ('round_trip','multi_city')),
  leg_count smallint NOT NULL CHECK (leg_count BETWEEN 2 AND 6),
  vehicle_type_id uuid NOT NULL REFERENCES public.vehicle_types(id),
  currency text NOT NULL DEFAULT 'AED',
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  discount_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 50),
  discount_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_price numeric(10,2) NOT NULL CHECK (total_price >= 0),
  booking_status text NOT NULL DEFAULT 'pending'
    CHECK (booking_status IN ('pending','confirmed','completed','cancelled','refunded')),
  payment_status text NOT NULL DEFAULT 'processing'
    CHECK (payment_status IN ('pending','processing','completed','failed','refunded')),
  stripe_payment_intent_id text UNIQUE,
  stripe_charge_id text,
  paid_at timestamptz,
  payment_method_details jsonb,
  price_signature text,
  price_signature_timestamp bigint,
  price_signature_nonce text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX booking_groups_customer_id_idx ON public.booking_groups (customer_id);

ALTER TABLE public.booking_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own booking groups" ON public.booking_groups
  FOR SELECT USING ((select auth.uid()) = customer_id);
CREATE POLICY "Admins can view all booking groups" ON public.booking_groups
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role));
CREATE POLICY "Service role can manage all booking groups" ON public.booking_groups
  FOR ALL USING ((select auth.role()) = 'service_role');

CREATE TRIGGER booking_groups_set_updated_at
  BEFORE UPDATE ON public.booking_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.bookings
  ADD COLUMN trip_type text NOT NULL DEFAULT 'one_way'
    CHECK (trip_type IN ('one_way','round_trip','multi_city','hourly')),
  ADD COLUMN booking_group_id uuid REFERENCES public.booking_groups(id) ON DELETE CASCADE,
  ADD COLUMN leg_index smallint CHECK (leg_index >= 0),
  ADD COLUMN hourly_package text CHECK (hourly_package IN ('half_day','full_day')),
  ADD COLUMN duration_hours numeric(4,1) CHECK (duration_hours > 0 AND duration_hours <= 24),
  ADD COLUMN included_km integer CHECK (included_km >= 0),
  ADD COLUMN extra_hour_price numeric(10,2) CHECK (extra_hour_price >= 0),
  ADD COLUMN discount_amount numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  ADD COLUMN refund_due numeric(10,2) CHECK (refund_due >= 0);

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_hourly_has_duration
    CHECK (trip_type <> 'hourly' OR (duration_hours IS NOT NULL AND hourly_package IS NOT NULL)),
  ADD CONSTRAINT bookings_grouped_trip_has_group
    CHECK (trip_type NOT IN ('round_trip','multi_city') OR (booking_group_id IS NOT NULL AND leg_index IS NOT NULL)),
  ADD CONSTRAINT bookings_group_leg_unique UNIQUE (booking_group_id, leg_index);

CREATE INDEX bookings_booking_group_id_idx ON public.bookings (booking_group_id)
  WHERE booking_group_id IS NOT NULL;

CREATE TABLE public.vehicle_type_hourly_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type_id uuid NOT NULL REFERENCES public.vehicle_types(id) ON DELETE CASCADE,
  package text NOT NULL CHECK (package IN ('half_day','full_day')),
  hours numeric(4,1) NOT NULL CHECK (hours > 0 AND hours <= 24),
  included_km integer NOT NULL DEFAULT 0 CHECK (included_km >= 0),
  price numeric(10,2) NOT NULL CHECK (price > 0),
  extra_hour_price numeric(10,2) NOT NULL DEFAULT 0 CHECK (extra_hour_price >= 0),
  currency text NOT NULL DEFAULT 'AED',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vehicle_type_id, package)
);

ALTER TABLE public.vehicle_type_hourly_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active hourly packages" ON public.vehicle_type_hourly_packages
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage hourly packages" ON public.vehicle_type_hourly_packages
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'::user_role));

CREATE TRIGGER vehicle_type_hourly_packages_set_updated_at
  BEFORE UPDATE ON public.vehicle_type_hourly_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.service_codes (code, description, service_type)
VALUES ('H', 'Hourly hire (as directed)', 'hourly')
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_booking_trip_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_from_type_id UUID;
  v_to_type_id UUID;
  v_service_code TEXT;
BEGIN
  IF NEW.trip_type = 'hourly' THEN
    v_service_code := 'H';
  ELSIF NEW.from_location_id IS NOT NULL AND NEW.to_location_id IS NOT NULL THEN
    SELECT location_type_id INTO v_from_type_id FROM locations WHERE id = NEW.from_location_id;
    SELECT location_type_id INTO v_to_type_id FROM locations WHERE id = NEW.to_location_id;
    v_service_code := derive_transfer_service_code(v_from_type_id, v_to_type_id);
  ELSE
    v_service_code := 'T';
  END IF;

  NEW.trip_number := generate_trip_number(v_service_code);
  RETURN NEW;
END;
$function$;

-- A group raises one admin notification (on its lead leg), not one per leg.
CREATE OR REPLACE FUNCTION public.notify_new_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  customer_name_display TEXT;
BEGIN
  IF NEW.booking_group_id IS NOT NULL AND COALESCE(NEW.leg_index, 0) > 0 THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, email, 'Guest')
  INTO customer_name_display
  FROM profiles
  WHERE id = NEW.customer_id;

  IF customer_name_display IS NULL THEN
    customer_name_display := 'Guest';
  END IF;

  PERFORM create_admin_notification(
    'booking'::notification_category,
    'booking_created',
    'New Booking Received',
    'Booking #' || COALESCE(NEW.trip_number, NEW.booking_number) || ' from ' || customer_name_display,
    jsonb_build_object(
      'booking_id', NEW.id,
      'booking_number', NEW.booking_number,
      'trip_number', NEW.trip_number,
      'customer_id', NEW.customer_id,
      'booking_group_id', NEW.booking_group_id
    ),
    '/admin/bookings/' || NEW.id
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_payment_failed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  customer_name TEXT;
  booking_num TEXT;
  trip_num TEXT;
BEGIN
  IF NEW.booking_group_id IS NOT NULL AND COALESCE(NEW.leg_index, 0) > 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.payment_status = 'failed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'failed') THEN
    customer_name := COALESCE(
      (SELECT full_name FROM profiles WHERE id = NEW.customer_id LIMIT 1),
      (SELECT btrim(first_name || ' ' || last_name)
         FROM booking_passengers
        WHERE booking_id = NEW.id AND is_primary IS TRUE
        ORDER BY created_at
        LIMIT 1),
      'Customer'
    );

    booking_num := NEW.booking_number;
    trip_num    := NEW.trip_number;

    PERFORM create_admin_notification(
      'payment'::notification_category,
      'payment_failed',
      'Payment Failed',
      'Payment failed for booking #' || COALESCE(trip_num, booking_num) || ' (' || customer_name || ')',
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_number', booking_num,
        'trip_number', trip_num,
        'customer_id', NEW.customer_id
      ),
      '/admin/bookings/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Group payment confirms every leg at once: notify the customer once (lead leg).
-- Cancellation stays per leg, because legs are cancelled individually.
CREATE OR REPLACE FUNCTION public.notify_customer_booking_status_changed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  booking_num TEXT;
  trip_num TEXT;
  status_label TEXT;
BEGIN
  IF NEW.booking_group_id IS NOT NULL AND COALESCE(NEW.leg_index, 0) > 0
     AND NEW.booking_status = 'confirmed' THEN
    RETURN NEW;
  END IF;

  IF OLD IS NOT NULL AND NEW.booking_status != OLD.booking_status THEN
    SELECT booking_number, trip_number INTO booking_num, trip_num
    FROM bookings
    WHERE id = NEW.id
    LIMIT 1;

    status_label := CASE NEW.booking_status
      WHEN 'pending' THEN 'Pending Assignment'
      WHEN 'assigned' THEN 'Assigned to Vendor'
      WHEN 'confirmed' THEN 'Confirmed'
      WHEN 'in_progress' THEN 'In Progress'
      WHEN 'completed' THEN 'Completed'
      WHEN 'cancelled' THEN 'Cancelled'
      ELSE NEW.booking_status
    END;

    PERFORM create_customer_notification(
      NEW.customer_id,
      'booking'::notification_category,
      'booking_status_changed',
      'Booking Status Updated',
      'Your booking #' || COALESCE(trip_num, booking_num, NEW.id::TEXT) || ' is now ' || status_label,
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_number', booking_num,
        'trip_number', trip_num,
        'old_status', OLD.booking_status,
        'new_status', NEW.booking_status
      ),
      '/customer/bookings/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$;
