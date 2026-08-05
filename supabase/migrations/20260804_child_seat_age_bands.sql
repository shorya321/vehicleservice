-- Child seat age bands: warn when the entered age doesn't suit the seat
-- Date: 2026-08-04
-- Description: Every child seat asks for one age per seat, and the dropdown offers 0-12 for ALL
--              seats. Each seat covers a narrow band though (Infant "under 1", Toddler "1-4",
--              Booster "4-11"), so the UI accepted a 12-year-old in an Infant Car Seat and said
--              nothing — nobody found out until the driver arrived with the wrong restraint.
--
--              WHY A WARNING RATHER THAN A NARROWED DROPDOWN:
--              Constraining the age options to the seat's band would mean the age can never
--              contradict the seat — and that contradiction is the entire reason the age is
--              collected. A parent who opens "Infant Car Seat" for their 7-year-old and is offered
--              only "Under 1" will most likely pick the closest allowed value and move on, storing
--              a FALSE age as fact. That is worse than the mismatch it was meant to prevent: the
--              seat is still wrong and now the data lies about it. The full 0-12 range stays, and
--              an out-of-band age is left visible as evidence of a wrong pick.
--
--              WHY COLUMNS RATHER THAN A HARDCODED NAME->BAND MAP:
--              Mirrors requires_child_age. Seats can be renamed or added from the admin UI, and a
--              map keyed on names would break silently the moment that happened. A NULL band means
--              "never warn", so a newly created add-on is inert until an admin configures it.
--
--              The warning these drive is NON-BLOCKING by design: real children fall outside
--              typical bands (small or large for their age, medical needs), and the parent is the
--              authority on their own child. Do not turn this into a hard validation.
--
--              Non-breaking: both columns are nullable, every existing read uses an explicit column
--              list that omits them, and nothing writes them except the admin form.

ALTER TABLE public.addons
  ADD COLUMN IF NOT EXISTS child_age_min smallint NULL,
  ADD COLUMN IF NOT EXISTS child_age_max smallint NULL;

-- Both set or both null: a half-configured band would warn unpredictably (is a missing max
-- "no upper limit" or "not configured"?). Bounds mirror CHILD_AGE_OPTIONS (0-12) in the three
-- pickers, so a band can never exclude every option the customer is offered.
ALTER TABLE public.addons
  DROP CONSTRAINT IF EXISTS addons_child_age_band_valid;
ALTER TABLE public.addons
  ADD CONSTRAINT addons_child_age_band_valid CHECK (
    (child_age_min IS NULL AND child_age_max IS NULL)
    OR (
      child_age_min IS NOT NULL AND child_age_max IS NOT NULL
      AND child_age_min BETWEEN 0 AND 12
      AND child_age_max BETWEEN 0 AND 12
      AND child_age_min <= child_age_max
    )
  );

-- Backfill from the age ranges already stated in each seat's description (set by
-- 20260804_child_seat_age_descriptions.sql). The overlap at age 4 between Toddler and Booster is
-- deliberate — weight, not age, is the real determinant, and a 4-year-old can legitimately be in
-- either. An age inside ANY configured band produces no warning.
UPDATE public.addons SET child_age_min = 0,  child_age_max = 1
 WHERE name = 'Infant Car Seat'    AND category = 'Child Safety';

UPDATE public.addons SET child_age_min = 1,  child_age_max = 4
 WHERE name = 'Toddler Car Seat'   AND category = 'Child Safety';

UPDATE public.addons SET child_age_min = 4,  child_age_max = 11
 WHERE name = 'Booster Seat'       AND category = 'Child Safety';

UPDATE public.addons SET child_age_min = 4,  child_age_max = 11
 WHERE name = 'Extra Booster Seat' AND category = 'Child Safety';

COMMENT ON COLUMN public.addons.child_age_min IS
  'Lower bound of the typical age this add-on suits. NULL (with child_age_max) disables the fit warning.';
COMMENT ON COLUMN public.addons.child_age_max IS
  'Upper bound of the typical age this add-on suits. NULL (with child_age_min) disables the fit warning.';
