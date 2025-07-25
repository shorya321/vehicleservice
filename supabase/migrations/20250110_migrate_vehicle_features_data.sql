-- Migration to transfer existing features from JSON to new tables
-- This should run after the vehicle_features tables are created

-- First, create a temporary function to migrate features
CREATE OR REPLACE FUNCTION migrate_vehicle_features() RETURNS void AS $$
DECLARE
    vehicle_record RECORD;
    feature_name TEXT;
    feature_id UUID;
BEGIN
    -- Loop through all vehicles with features
    FOR vehicle_record IN 
        SELECT id, features 
        FROM public.vehicles 
        WHERE features IS NOT NULL 
        AND features::text != '[]'
        AND features::text != 'null'
    LOOP
        -- Loop through each feature in the JSON array
        FOR feature_name IN 
            SELECT jsonb_array_elements_text(vehicle_record.features::jsonb)
        LOOP
            -- Try to find existing feature or create new one
            INSERT INTO public.vehicle_features (name, slug, category)
            VALUES (
                feature_name, 
                LOWER(REPLACE(REPLACE(feature_name, ' ', '-'), '/', '-')),
                'convenience' -- Default category, can be updated later
            )
            ON CONFLICT (name) DO NOTHING
            RETURNING id INTO feature_id;
            
            -- If feature already existed, get its ID
            IF feature_id IS NULL THEN
                SELECT id INTO feature_id 
                FROM public.vehicle_features 
                WHERE name = feature_name;
            END IF;
            
            -- Create the mapping
            INSERT INTO public.vehicle_feature_mappings (vehicle_id, feature_id)
            VALUES (vehicle_record.id, feature_id)
            ON CONFLICT (vehicle_id, feature_id) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_vehicle_features();

-- Drop the temporary function
DROP FUNCTION migrate_vehicle_features();

-- Now remove the features column from vehicles table
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS features;

-- Add a comment to document this migration
COMMENT ON TABLE public.vehicle_features IS 'Master list of available vehicle features';
COMMENT ON TABLE public.vehicle_feature_mappings IS 'Junction table linking vehicles to their features';
COMMENT ON COLUMN public.vehicle_features.category IS 'Feature category: comfort, safety, technology, entertainment, convenience, performance';

-- Create a view for easier querying of vehicles with their features
CREATE OR REPLACE VIEW public.vehicles_with_features AS
SELECT 
    v.*,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', vf.id,
                'name', vf.name,
                'slug', vf.slug,
                'icon', vf.icon,
                'category', vf.category
            ) ORDER BY vf.sort_order, vf.name
        ) FILTER (WHERE vf.id IS NOT NULL), 
        '[]'::jsonb
    ) AS features
FROM public.vehicles v
LEFT JOIN public.vehicle_feature_mappings vfm ON v.id = vfm.vehicle_id
LEFT JOIN public.vehicle_features vf ON vfm.feature_id = vf.id AND vf.is_active = true
GROUP BY v.id;

-- Grant permissions on the view
GRANT SELECT ON public.vehicles_with_features TO authenticated;
GRANT SELECT ON public.vehicles_with_features TO anon;