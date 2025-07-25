-- Drop the vehicles_with_features view as it's no longer needed
-- The view was created for backward compatibility during migration from JSON to relational structure
-- All application code now uses the proper relational structure with vehicle_feature_mappings table

DROP VIEW IF EXISTS public.vehicles_with_features;