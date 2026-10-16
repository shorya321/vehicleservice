-- Quotation trips may be one way, round trip, multi-city or hourly, mirroring business bookings.
-- Additive only: every existing row becomes trip_type 'one_way' and keeps all its values.

ALTER TABLE public.business_quotation_items
  ADD COLUMN trip_type text NOT NULL DEFAULT 'one_way',
  ADD COLUMN hourly_package text,
  ADD COLUMN duration_hours numeric(4,1),
  ADD COLUMN included_km integer,
  ADD COLUMN extra_hour_price numeric(10,2),
  ADD COLUMN converted_group_id uuid REFERENCES public.business_booking_groups(id) ON DELETE SET NULL;

ALTER TABLE public.business_quotation_items
  ALTER COLUMN to_location_id DROP NOT NULL,
  ALTER COLUMN dropoff_address DROP NOT NULL;

ALTER TABLE public.business_quotation_items
  ADD CONSTRAINT bqi_trip_type CHECK (trip_type IN ('one_way','round_trip','multi_city','hourly')),
  ADD CONSTRAINT bqi_destination CHECK (
    trip_type = 'hourly' OR (to_location_id IS NOT NULL AND dropoff_address IS NOT NULL)
  ),
  ADD CONSTRAINT bqi_hourly CHECK (
    (trip_type = 'hourly' AND hourly_package IN ('half_day','full_day') AND duration_hours > 0)
    OR (trip_type <> 'hourly' AND hourly_package IS NULL AND duration_hours IS NULL)
  );

CREATE INDEX idx_bqi_converted_group ON public.business_quotation_items(converted_group_id)
  WHERE converted_group_id IS NOT NULL;

-- Journeys of a round trip or multi-city quotation trip, in travel order. Leg 0 mirrors the
-- item's own route and pickup columns. One way and hourly trips have no rows here.
CREATE TABLE public.business_quotation_item_legs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.business_quotation_items(id) ON DELETE CASCADE,
  leg_index smallint NOT NULL CHECK (leg_index BETWEEN 0 AND 5),
  from_location_id uuid NOT NULL REFERENCES public.locations(id),
  to_location_id uuid NOT NULL REFERENCES public.locations(id),
  pickup_address text NOT NULL,
  dropoff_address text NOT NULL,
  pickup_datetime timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bqil_route_distinct CHECK (from_location_id <> to_location_id),
  CONSTRAINT bqil_unique_leg UNIQUE (item_id, leg_index)
);

ALTER TABLE public.business_quotation_item_legs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_quotation_item_legs FROM anon;

CREATE POLICY "Business members manage permitted quotation item legs"
  ON public.business_quotation_item_legs
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.business_quotation_items i
    JOIN public.business_quotations q ON q.id = i.quotation_id
    JOIN public.business_users bu ON bu.business_account_id = q.business_account_id
    WHERE i.id = business_quotation_item_legs.item_id
      AND bu.auth_user_id = (SELECT auth.uid()) AND bu.is_active
      AND (bu.role = 'owner' OR q.created_by_user_id = bu.id)))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.business_quotation_items i
    JOIN public.business_quotations q ON q.id = i.quotation_id
    JOIN public.business_users bu ON bu.business_account_id = q.business_account_id
    WHERE i.id = business_quotation_item_legs.item_id
      AND bu.auth_user_id = (SELECT auth.uid()) AND bu.is_active
      AND (bu.role = 'owner' OR q.created_by_user_id = bu.id)));
