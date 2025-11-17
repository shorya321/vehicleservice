-- Remove the backward compatibility view as it's no longer needed
-- This view was created during the migration from JSON to relational structure
-- but is not used anywhere in the application code

DROP VIEW IF EXISTS public.vehicles_with_features;

-- Note: After running this migration, regenerate TypeScript types:
-- npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts