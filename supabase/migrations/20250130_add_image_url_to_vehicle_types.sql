-- Add image_url column to vehicle_types table
ALTER TABLE public.vehicle_types
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.vehicle_types.image_url IS 'URL of the vehicle type image stored in Supabase Storage';