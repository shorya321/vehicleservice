-- Create booking_amenities table for tracking booked amenities
CREATE TABLE IF NOT EXISTS booking_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  amenity_type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_positive_quantity CHECK (quantity > 0),
  CONSTRAINT check_positive_price CHECK (price >= 0)
);

-- Create index for booking amenities
CREATE INDEX idx_booking_amenities_booking_id ON booking_amenities(booking_id);

-- Add RLS policies
ALTER TABLE booking_amenities ENABLE ROW LEVEL SECURITY;

-- Allow users to view amenities for their own bookings
CREATE POLICY "Users can view own booking amenities"
  ON booking_amenities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_amenities.booking_id
      AND (
        bookings.customer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'vendor')
        )
      )
    )
  );

-- Allow admins and vendors to manage booking amenities
CREATE POLICY "Admins and vendors can manage booking amenities"
  ON booking_amenities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'vendor')
    )
  );