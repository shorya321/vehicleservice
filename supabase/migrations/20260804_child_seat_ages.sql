-- Child seats: priced add-ons with a per-seat child age
-- Date: 2026-08-04
-- Description: The four `Child Safety` addon rows have always existed, been `is_active` and been
--              priced, but were hidden from every booking flow by two independent
--              `.neq('category', 'Child Safety')` filters (app/checkout/actions.ts and
--              app/business/(portal)/bookings/new/actions.ts), each carrying a "do not fix this"
--              comment on the theory that seats were free and implied by the guest breakdown.
--              They are now sold, and the operator needs the child's age PER SEAT to fit the
--              correct restraint: UAE law requires a safety seat under 4 and a restraint to age 10
--              / 145cm, and infant / toddler / booster are three different pieces of equipment
--              (see 20260716_dubai_addon_cleanup.sql).
--
--              WHY A FLAG RATHER THAN THE CATEGORY STRING:
--              `requires_child_age` is admin-configurable per addon. The category column is free
--              text with no CHECK, and the admin form hardcodes only three values — keying seat
--              behaviour off a magic string would make the rule uneditable from the admin UI and
--              silently wrong the moment someone adds a fourth category.
--
--              WHY smallint[] RATHER THAN jsonb OR A CHILD TABLE:
--              Ages are never queried independently of their line, so a child table would buy
--              nothing and cost a join, an RLS policy and a cascade at ~12 read sites. jsonb cannot
--              express the ages-length-equals-quantity invariant; an array can, in the CHECK below.
--              Decisively: business_quotation_item_addons carries
--              `bqia_unique UNIQUE (item_id, addon_id)` (20260724_business_quotations.sql), so
--              "one row per seat" is impossible there. An array on the single row is the only shape
--              that works identically across all three tables.
--
--              WHY THIS IS NON-BREAKING:
--              Every child_ages is NULL for existing rows and for every non-child add-on, and all
--              existing reads use explicit column lists that omit it. requires_child_age is
--              NOT NULL DEFAULT false, so createAddon (app/admin/addons/actions.ts, explicit column
--              list) keeps working untouched.
--
--              The `array_length = quantity` half of the CHECK is safe because nothing in the
--              codebase ever UPDATEs an addon line: booking_amenities is insert-only
--              (app/checkout/actions.ts) plus a delete (app/admin/bookings/actions.ts);
--              business_booking_addons is insert-only; quotation addons are deleted and reinserted
--              wholesale (lib/business/quotations/persist.ts). A quantity can therefore never drift
--              out of step with its ages after the fact.
--
--              AGE RANGE: 0-12 inclusive, where 0 means "under 1". 12 is the upper bound because
--              the restraint requirement ends at 10 / 145cm and the guest picker already labels
--              adults as "Age 12+".

-- 1. The shared catalogue flag. This is the ONLY thing the customer and business modules share;
--    each module keeps its own query, UI and validation (see lib/business/guest-breakdown.ts for
--    the same deliberate-duplication rule).
ALTER TABLE public.addons
  ADD COLUMN IF NOT EXISTS requires_child_age boolean NOT NULL DEFAULT false;

-- Backfill: the four live Child Safety rows are exactly the age-requiring ones today. Done here
-- rather than left to the admin so the feature is correct the moment the code ships.
UPDATE public.addons
   SET requires_child_age = true
 WHERE category = 'Child Safety';

COMMENT ON COLUMN public.addons.requires_child_age IS
  'When true, checkout / the business portal / quotations ask for one child age per selected unit and cap total units at children + infants.';


-- 2. Per-seat ages on all three add-on line tables.

ALTER TABLE public.booking_amenities
  ADD COLUMN IF NOT EXISTS child_ages smallint[] NULL;

ALTER TABLE public.business_booking_addons
  ADD COLUMN IF NOT EXISTS child_ages smallint[] NULL;

ALTER TABLE public.business_quotation_item_addons
  ADD COLUMN IF NOT EXISTS child_ages smallint[] NULL;


-- 3. The same invariant on each table: one age per seat, and only plausible child ages.
--    `<@` (array containment) also rejects NULL elements, so '{2,NULL}' cannot be stored — a plain
--    per-element BETWEEN would let a NULL through. Subqueries are not permitted in CHECK, hence the
--    literal allowed-value array rather than generate_series.
--    COALESCE(quantity, 1) is only strictly required on booking_amenities (its quantity is
--    nullable); kept uniform across all three so the three constraints stay diffable.

ALTER TABLE public.booking_amenities
  DROP CONSTRAINT IF EXISTS booking_amenities_child_ages_valid;
ALTER TABLE public.booking_amenities
  ADD CONSTRAINT booking_amenities_child_ages_valid CHECK (
    child_ages IS NULL
    OR (
      array_ndims(child_ages) = 1
      AND COALESCE(array_length(child_ages, 1), 0) = COALESCE(quantity, 1)
      AND child_ages <@ ARRAY[0,1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]
    )
  );

ALTER TABLE public.business_booking_addons
  DROP CONSTRAINT IF EXISTS business_booking_addons_child_ages_valid;
ALTER TABLE public.business_booking_addons
  ADD CONSTRAINT business_booking_addons_child_ages_valid CHECK (
    child_ages IS NULL
    OR (
      array_ndims(child_ages) = 1
      AND COALESCE(array_length(child_ages, 1), 0) = COALESCE(quantity, 1)
      AND child_ages <@ ARRAY[0,1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]
    )
  );

ALTER TABLE public.business_quotation_item_addons
  DROP CONSTRAINT IF EXISTS business_quotation_item_addons_child_ages_valid;
ALTER TABLE public.business_quotation_item_addons
  ADD CONSTRAINT business_quotation_item_addons_child_ages_valid CHECK (
    child_ages IS NULL
    OR (
      array_ndims(child_ages) = 1
      AND COALESCE(array_length(child_ages, 1), 0) = COALESCE(quantity, 1)
      AND child_ages <@ ARRAY[0,1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]
    )
  );

COMMENT ON COLUMN public.booking_amenities.child_ages IS
  'One age in years (0 = under 1) per selected seat; length always equals quantity. NULL when the addon''s requires_child_age is false.';
COMMENT ON COLUMN public.business_booking_addons.child_ages IS
  'One age in years (0 = under 1) per selected seat; length always equals quantity. NULL when the addon''s requires_child_age is false.';
COMMENT ON COLUMN public.business_quotation_item_addons.child_ages IS
  'One age in years (0 = under 1) per selected seat; length always equals quantity. NULL when the addon''s requires_child_age is false.';
