-- Add image_url column to vehicle_categories table
ALTER TABLE public.vehicle_categories
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update updated_at to track changes
ALTER TABLE public.vehicle_categories
ALTER COLUMN updated_at SET DEFAULT TIMEZONE('utc'::text, NOW());