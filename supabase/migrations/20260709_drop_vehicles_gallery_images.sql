-- Drop the dead `vehicles.gallery_images` column.
--
-- Gallery images were written on every vehicle save but rendered nowhere.
-- The only read fed SearchResultVehicle.images in app/search/results/actions.ts,
-- an interface that never left its own file; `.images` was never rendered.
-- No view, materialized view, function, index, RLS policy or constraint
-- referenced the column, and `gallery_images` existed on exactly one table.
--
-- Commit 4eb1c45 removed the last writer and the gallery UI.
--
-- ============================================================================
-- ORDER OF OPERATIONS -- read before applying.
--
--   1. Deploy 4eb1c45 to production.
--   2. Run `npx tsx scripts/purge-vehicle-gallery-images.ts` to delete the
--      orphaned Storage objects. It reads their paths FROM THIS COLUMN, so it
--      must run BEFORE the column is dropped. Once the column is gone the
--      paths are unrecoverable and the files are orphaned forever.
--   3. Apply this migration.
--   4. Remove the three `gallery_images` lines from lib/supabase/types.ts
--      (Row / Insert / Update) and update docs/vehicle-module.md.
--
-- Applying this while any old instance is still serving traffic breaks
-- `INSERT ... gallery_images` and therefore vehicle creation outright.
--
-- This is irreversible. Take a snapshot first.
-- ============================================================================

-- Fail loudly rather than silently orphaning files if step 2 was skipped.
DO $$
DECLARE
  remaining bigint;
BEGIN
  SELECT coalesce(sum(jsonb_array_length(coalesce(gallery_images, '[]'::jsonb))), 0)
    INTO remaining
    FROM public.vehicles;

  IF remaining > 0 THEN
    RAISE EXCEPTION
      'Refusing to drop gallery_images: % storage object(s) still referenced. Run scripts/purge-vehicle-gallery-images.ts first.',
      remaining;
  END IF;
END $$;

ALTER TABLE public.vehicles DROP COLUMN gallery_images;
