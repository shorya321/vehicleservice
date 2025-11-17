-- Remove driver-specific fields from profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS driver_languages,
  DROP COLUMN IF EXISTS driver_license_expiry,
  DROP COLUMN IF EXISTS driver_license_number,
  DROP COLUMN IF EXISTS driver_rating,
  DROP COLUMN IF EXISTS driver_status,
  DROP COLUMN IF EXISTS driver_total_trips;

-- Update the user_role enum to remove 'driver' role
-- First, we need to update any existing driver roles to customer
UPDATE public.profiles SET role = 'customer' WHERE role = 'driver';

-- Create a new enum without driver
CREATE TYPE user_role_new AS ENUM ('admin', 'customer', 'vendor');

-- Update the column to use the new enum
ALTER TABLE public.profiles 
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE user_role_new USING role::text::user_role_new,
  ALTER COLUMN role SET DEFAULT 'customer';

-- Drop the old enum and rename the new one
DROP TYPE user_role;
ALTER TYPE user_role_new RENAME TO user_role;