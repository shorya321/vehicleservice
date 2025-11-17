-- Create booking_assignments table for vendor assignment workflow
CREATE TABLE IF NOT EXISTS booking_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendor_applications(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_assignments_booking_id ON booking_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_assignments_vendor_id ON booking_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_booking_assignments_driver_id ON booking_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_booking_assignments_vehicle_id ON booking_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_booking_assignments_assigned_by ON booking_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_booking_assignments_status ON booking_assignments(status);
CREATE INDEX IF NOT EXISTS idx_booking_assignments_assigned_at ON booking_assignments(assigned_at);

-- Ensure only one active assignment per booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_assignments_active 
ON booking_assignments(booking_id) 
WHERE status IN ('pending', 'accepted');

-- Create RLS policies
ALTER TABLE booking_assignments ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all assignments
CREATE POLICY "Admins can manage all booking assignments"
ON booking_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy for vendors to view and update their assignments
CREATE POLICY "Vendors can view and update their assignments"
ON booking_assignments
FOR ALL
USING (
  vendor_id IN (
    SELECT id FROM vendor_applications
    WHERE user_id = auth.uid()
  )
);

-- Policy for drivers to view their assignments
CREATE POLICY "Drivers can view their assignments"
ON booking_assignments
FOR SELECT
USING (
  driver_id IN (
    SELECT id FROM drivers
    WHERE vendor_id IN (
      SELECT id FROM vendor_applications
      WHERE user_id = auth.uid()
    )
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_booking_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_assignments_updated_at
BEFORE UPDATE ON booking_assignments
FOR EACH ROW
EXECUTE FUNCTION update_booking_assignments_updated_at();

-- Add comments for documentation
COMMENT ON TABLE booking_assignments IS 'Tracks booking assignments to vendors and drivers';
COMMENT ON COLUMN booking_assignments.booking_id IS 'Reference to the booking being assigned';
COMMENT ON COLUMN booking_assignments.vendor_id IS 'The vendor this booking is assigned to';
COMMENT ON COLUMN booking_assignments.driver_id IS 'The driver assigned by the vendor';
COMMENT ON COLUMN booking_assignments.vehicle_id IS 'The vehicle assigned for this booking';
COMMENT ON COLUMN booking_assignments.assigned_by IS 'The admin user who created this assignment';
COMMENT ON COLUMN booking_assignments.status IS 'Current status of the assignment';
COMMENT ON COLUMN booking_assignments.assigned_at IS 'When the booking was assigned to vendor';
COMMENT ON COLUMN booking_assignments.accepted_at IS 'When the vendor accepted the assignment';
COMMENT ON COLUMN booking_assignments.rejected_at IS 'When the vendor rejected the assignment';
COMMENT ON COLUMN booking_assignments.cancelled_at IS 'When the assignment was cancelled';