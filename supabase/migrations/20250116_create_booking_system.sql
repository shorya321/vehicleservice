-- Create route_searches table to track popular routes
CREATE TABLE route_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  origin_location_id UUID REFERENCES locations(id),
  destination_location_id UUID REFERENCES locations(id),
  search_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  passenger_count INTEGER DEFAULT 1,
  ip_address INET,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for route_searches
CREATE INDEX idx_route_searches_route_id ON route_searches(route_id);
CREATE INDEX idx_route_searches_search_date ON route_searches(search_date);
CREATE INDEX idx_route_searches_user_id ON route_searches(user_id);

-- Create vehicle_amenities table
CREATE TABLE vehicle_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  amenity_type TEXT NOT NULL CHECK (amenity_type IN ('child_seat_infant', 'child_seat_booster', 'ski_box', 'bike_rack', 'extra_luggage', 'wifi', 'water_bottles')),
  price DECIMAL(10, 2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint for vehicle amenities
CREATE UNIQUE INDEX idx_vehicle_amenities_unique ON vehicle_amenities(vehicle_id, amenity_type);

-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,
  route_id UUID REFERENCES routes(id),
  vehicle_id UUID REFERENCES vehicles(id),
  vendor_id UUID REFERENCES vendor_applications(id),
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  pickup_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  passenger_count INTEGER NOT NULL DEFAULT 1 CHECK (passenger_count > 0 AND passenger_count <= 50),
  base_price DECIMAL(10, 2) NOT NULL,
  amenities_price DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES users(id),
  driver_notes TEXT,
  customer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for bookings
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_vendor_id ON bookings(vendor_id);
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_pickup_datetime ON bookings(pickup_datetime);
CREATE INDEX idx_bookings_booking_number ON bookings(booking_number);

-- Create booking_passengers table
CREATE TABLE booking_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for booking passengers
CREATE INDEX idx_booking_passengers_booking_id ON booking_passengers(booking_id);

-- Create booking_amenities table (junction table for selected amenities)
CREATE TABLE booking_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  amenity_type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for booking amenities
CREATE INDEX idx_booking_amenities_booking_id ON booking_amenities(booking_id);

-- Create booking_status_history table for tracking status changes
CREATE TABLE booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for booking status history
CREATE INDEX idx_booking_status_history_booking_id ON booking_status_history(booking_id);

-- Create function to generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
DECLARE
  booking_num TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate a booking number like "BK-20250116-XXXX"
    booking_num := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if this number already exists
    SELECT COUNT(*) INTO exists_count FROM bookings WHERE booking_number = booking_num;
    
    -- If it doesn't exist, we can use it
    IF exists_count = 0 THEN
      RETURN booking_num;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set booking number
CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := generate_booking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_number_trigger
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_number();

-- Create trigger to log status changes
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_booking_status_trigger
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION log_booking_status_change();

-- Create RLS policies for route_searches
ALTER TABLE route_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create route searches"
ON route_searches
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can view their own searches"
ON route_searches
FOR SELECT
TO public
USING (user_id = auth.uid() OR user_id IS NULL);

-- Create RLS policies for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own bookings"
ON bookings
FOR SELECT
TO public
USING (customer_id = auth.uid());

CREATE POLICY "Vendors can view their bookings"
ON bookings
FOR SELECT
TO public
USING (
  vendor_id IN (
    SELECT id FROM vendor_applications WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Customers can create bookings"
ON bookings
FOR INSERT
TO public
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update their pending bookings"
ON bookings
FOR UPDATE
TO public
USING (customer_id = auth.uid() AND status = 'pending')
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Vendors can update their bookings"
ON bookings
FOR UPDATE
TO public
USING (
  vendor_id IN (
    SELECT id FROM vendor_applications WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for booking_passengers
ALTER TABLE booking_passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage passengers for their bookings"
ON booking_passengers
FOR ALL
TO public
USING (
  booking_id IN (
    SELECT id FROM bookings WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Vendors can view passengers for their bookings"
ON booking_passengers
FOR SELECT
TO public
USING (
  booking_id IN (
    SELECT id FROM bookings WHERE vendor_id IN (
      SELECT id FROM vendor_applications WHERE user_id = auth.uid()
    )
  )
);

-- Create RLS policies for vehicle_amenities
ALTER TABLE vehicle_amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vehicle amenities"
ON vehicle_amenities
FOR SELECT
TO public
USING (true);

CREATE POLICY "Vendors can manage their vehicle amenities"
ON vehicle_amenities
FOR ALL
TO public
USING (
  vehicle_id IN (
    SELECT id FROM vehicles WHERE vendor_id IN (
      SELECT id FROM vendor_applications WHERE user_id = auth.uid()
    )
  )
);

-- Create RLS policies for booking_amenities
ALTER TABLE booking_amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view amenities for their bookings"
ON booking_amenities
FOR SELECT
TO public
USING (
  booking_id IN (
    SELECT id FROM bookings WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Vendors can view amenities for their bookings"
ON booking_amenities
FOR SELECT
TO public
USING (
  booking_id IN (
    SELECT id FROM bookings WHERE vendor_id IN (
      SELECT id FROM vendor_applications WHERE user_id = auth.uid()
    )
  )
);

-- Create RLS policies for booking_status_history
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view status history for their bookings"
ON booking_status_history
FOR SELECT
TO public
USING (
  booking_id IN (
    SELECT id FROM bookings WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Vendors can view status history for their bookings"
ON booking_status_history
FOR SELECT
TO public
USING (
  booking_id IN (
    SELECT id FROM bookings WHERE vendor_id IN (
      SELECT id FROM vendor_applications WHERE user_id = auth.uid()
    )
  )
);