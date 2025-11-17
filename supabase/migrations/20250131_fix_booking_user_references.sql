-- Fix user references in bookings table
-- Drop existing foreign key constraints
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey,
DROP CONSTRAINT IF EXISTS bookings_cancelled_by_fkey;

ALTER TABLE route_searches
DROP CONSTRAINT IF EXISTS route_searches_user_id_fkey;

ALTER TABLE booking_status_history
DROP CONSTRAINT IF EXISTS booking_status_history_changed_by_fkey;

-- Add correct foreign key constraints to auth.users
ALTER TABLE bookings 
ADD CONSTRAINT bookings_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE SET NULL,
ADD CONSTRAINT bookings_cancelled_by_fkey 
  FOREIGN KEY (cancelled_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE route_searches
ADD CONSTRAINT route_searches_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE booking_status_history
ADD CONSTRAINT booking_status_history_changed_by_fkey 
  FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update RLS policies to ensure they work correctly
DROP POLICY IF EXISTS "Customers can create bookings" ON bookings;

CREATE POLICY "Customers can create bookings"
ON bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

-- Also create a policy for service role to bypass RLS
DROP POLICY IF EXISTS "Service role can manage all bookings" ON bookings;

CREATE POLICY "Service role can manage all bookings"
ON bookings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Similar policies for booking_passengers
DROP POLICY IF EXISTS "Users can manage passengers for their bookings" ON booking_passengers;

CREATE POLICY "Users can create passengers for their bookings"
ON booking_passengers
FOR INSERT
TO authenticated
WITH CHECK (
  booking_id IN (
    SELECT id FROM bookings WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Users can view passengers for their bookings"
ON booking_passengers
FOR SELECT
TO authenticated
USING (
  booking_id IN (
    SELECT id FROM bookings WHERE customer_id = auth.uid()
  )
);

-- Similar policies for booking_amenities
DROP POLICY IF EXISTS "Users can view amenities for their bookings" ON booking_amenities;

CREATE POLICY "Users can create amenities for their bookings"
ON booking_amenities
FOR INSERT
TO authenticated
WITH CHECK (
  booking_id IN (
    SELECT id FROM bookings WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Users can view amenities for their bookings"
ON booking_amenities
FOR SELECT
TO authenticated
USING (
  booking_id IN (
    SELECT id FROM bookings WHERE customer_id = auth.uid()
  )
);

-- Service role policies for amenities and passengers
CREATE POLICY "Service role can manage all booking passengers"
ON booking_passengers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage all booking amenities"
ON booking_amenities
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);