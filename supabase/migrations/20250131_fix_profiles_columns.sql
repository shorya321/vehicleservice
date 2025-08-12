-- Ensure all necessary columns exist in profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update the handle_new_user function to properly handle all fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert the profile
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    first_name, 
    last_name, 
    phone,
    role,
    status
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT(
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        CASE 
          WHEN NEW.raw_user_meta_data->>'first_name' IS NOT NULL 
            AND NEW.raw_user_meta_data->>'last_name' IS NOT NULL 
          THEN ' ' 
          ELSE '' 
        END,
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      )
    ),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'customer',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone
  WHERE profiles.first_name IS NULL OR profiles.first_name = '';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing profiles that are missing data from user metadata
UPDATE public.profiles p
SET 
  first_name = COALESCE(p.first_name, u.raw_user_meta_data->>'first_name', ''),
  last_name = COALESCE(p.last_name, u.raw_user_meta_data->>'last_name', ''),
  phone = COALESCE(p.phone, u.raw_user_meta_data->>'phone', ''),
  full_name = COALESCE(
    p.full_name,
    CONCAT(
      COALESCE(u.raw_user_meta_data->>'first_name', ''),
      CASE 
        WHEN u.raw_user_meta_data->>'first_name' IS NOT NULL 
          AND u.raw_user_meta_data->>'last_name' IS NOT NULL 
        THEN ' ' 
        ELSE '' 
      END,
      COALESCE(u.raw_user_meta_data->>'last_name', '')
    )
  )
FROM auth.users u
WHERE p.id = u.id
  AND (p.first_name IS NULL OR p.first_name = '' 
       OR p.last_name IS NULL OR p.last_name = ''
       OR p.phone IS NULL OR p.phone = '');