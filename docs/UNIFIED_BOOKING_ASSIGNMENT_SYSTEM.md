# Unified Booking Assignment System with WhatsApp Automation Support

## 📋 Overview

This document outlines the complete architecture and implementation plan for unifying customer and business booking assignments into a single system that supports both manual (admin dashboard) and automated (WhatsApp) vendor assignment workflows.

## 🎯 Business Requirements

### Current State Problems
1. **Business bookings are invisible to admin** - Admin panel only shows customer bookings from `bookings` table
2. **No vendor assignment for business bookings** - `booking_assignments` table only references `bookings`, not `business_bookings`
3. **Code duplication concern** - Risk of duplicating entire vendor workflow for business bookings
4. **Vendor confusion** - Vendor shouldn't need to distinguish between customer and business bookings

### Future Requirements (WhatsApp Automation)
1. **Automated vendor assignment** - When booking created, automatically assign to vendors based on vehicle category
2. **WhatsApp notifications** - Vendor receives booking details via WhatsApp with Yes/No options
3. **Sequential fallback** - If vendor says No or times out, automatically assign to next vendor in category
4. **Driver selection** - When vendor accepts, show available drivers via WhatsApp for selection
5. **Real-time notifications** - Send status updates to customer and admin throughout process

## 🏗️ Solution: Polymorphic Assignment Pattern

### Core Architecture Decision

**Single `booking_assignments` table** handles both customer and business bookings through polymorphic foreign keys.

**Key Principle:** Vendor workflow is completely unified - vendors don't know or care whether booking came from customer portal or business portal.

### Why This Architecture?

1. ✅ **Zero Code Duplication** - Same acceptance logic, same availability checks, same notification system
2. ✅ **Future-Proof** - WhatsApp automation works identically for both booking types
3. ✅ **No Breaking Changes** - Existing customer booking flow untouched
4. ✅ **Simple Vendor Experience** - One unified list, one workflow
5. ✅ **Maximum Code Reuse** - ~90% of vendor code reused

---

## 🗄️ Database Schema Design

### 1. booking_assignments Table Enhancement

```sql
-- Add polymorphic reference and automation fields
ALTER TABLE booking_assignments
ADD COLUMN business_booking_id UUID REFERENCES business_bookings(id) ON DELETE CASCADE,
ADD COLUMN attempt_number INT DEFAULT 1,
ADD COLUMN timeout_at TIMESTAMP,
ADD COLUMN whatsapp_message_id TEXT,
ADD COLUMN rejection_reason TEXT,
ADD COLUMN is_automated BOOLEAN DEFAULT false;

-- Ensure exactly ONE booking type is referenced
ADD CONSTRAINT booking_assignments_one_booking_type
  CHECK (
    (booking_id IS NOT NULL AND business_booking_id IS NULL) OR
    (booking_id IS NULL AND business_booking_id IS NOT NULL)
  );

-- Performance indexes
CREATE INDEX idx_booking_assignments_business ON booking_assignments(business_booking_id);
CREATE INDEX idx_booking_assignments_timeout ON booking_assignments(timeout_at) WHERE status = 'pending';
CREATE INDEX idx_booking_assignments_vendor_status ON booking_assignments(vendor_id, status);
CREATE INDEX idx_booking_assignments_attempt ON booking_assignments(booking_id, attempt_number) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_booking_assignments_business_attempt ON booking_assignments(business_booking_id, attempt_number) WHERE business_booking_id IS NOT NULL;
```

**Field Descriptions:**
- `business_booking_id` - References business_bookings table (mutually exclusive with booking_id)
- `attempt_number` - Which vendor attempt is this (1=first vendor, 2=second vendor, etc.)
- `timeout_at` - When to give up waiting for vendor response (used by automation)
- `whatsapp_message_id` - WhatsApp message ID for tracking responses
- `rejection_reason` - Why vendor rejected (timeout, manual rejection, etc.)
- `is_automated` - Was this assignment created automatically (true) or manually by admin (false)

### 2. vendor_categories Table (New)

```sql
-- Links vendors to vehicle categories for automated assignment
CREATE TABLE vendor_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_applications(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES vehicle_categories(id) ON DELETE CASCADE,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  rating DECIMAL(3,2) DEFAULT 0.00,
  distance_factor INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vendor_id, category_id)
);

CREATE INDEX idx_vendor_categories_category ON vendor_categories(category_id) WHERE is_active = true;
CREATE INDEX idx_vendor_categories_priority ON vendor_categories(category_id, priority DESC, rating DESC) WHERE is_active = true;

COMMENT ON TABLE vendor_categories IS 'Links vendors to vehicle categories for automated assignment queue';
COMMENT ON COLUMN vendor_categories.priority IS 'Manual priority override (higher = tried first)';
COMMENT ON COLUMN vendor_categories.is_active IS 'Can this vendor receive automated assignments?';
COMMENT ON COLUMN vendor_categories.rating IS 'Vendor rating (0-5) for queue ordering';
COMMENT ON COLUMN vendor_categories.distance_factor IS 'Average distance score for ordering';
```

### 3. Helper Database Functions

```sql
-- Get booking details regardless of type
CREATE OR REPLACE FUNCTION get_booking_for_assignment(assignment_id UUID)
RETURNS TABLE (
  booking_type TEXT,
  booking_id UUID,
  customer_name TEXT,
  pickup_datetime TIMESTAMP,
  from_location_id UUID,
  to_location_id UUID,
  vehicle_type_id UUID,
  total_price DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN ba.booking_id IS NOT NULL THEN 'customer'
      ELSE 'business'
    END as booking_type,
    COALESCE(ba.booking_id, ba.business_booking_id) as booking_id,
    COALESCE(b.customer_name, bb.customer_name) as customer_name,
    COALESCE(b.pickup_datetime, bb.pickup_datetime) as pickup_datetime,
    COALESCE(b.from_location_id, bb.from_location_id) as from_location_id,
    COALESCE(b.to_location_id, bb.to_location_id) as to_location_id,
    COALESCE(b.vehicle_type_id, bb.vehicle_type_id) as vehicle_type_id,
    COALESCE(b.total_price, bb.total_price) as total_price
  FROM booking_assignments ba
  LEFT JOIN bookings b ON ba.booking_id = b.id
  LEFT JOIN business_bookings bb ON ba.business_booking_id = bb.id
  WHERE ba.id = assignment_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 📐 System Architecture

### Unified Booking Assignment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Booking Creation                             │
│  (Customer Portal OR Business Portal OR Admin)                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │   Manual or Auto?     │
                └───────────┬───────────┘
                            │
            ┌───────────────┴───────────────┐
            ↓                               ↓
    ┌─────────────┐                ┌─────────────┐
    │   MANUAL    │                │  AUTOMATED  │
    │  Assignment │                │  Assignment │
    └──────┬──────┘                └──────┬──────┘
           │                              │
           │ Admin selects vendor         │ Query vendors by
           │                              │ vehicle category
           ↓                              ↓
    ┌─────────────────────────────────────────────┐
    │      Create booking_assignment Row          │
    │  (booking_id OR business_booking_id)        │
    │          status = 'pending'                 │
    └─────────────────┬───────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
    ┌──────────┐          ┌─────────────┐
    │ Vendor   │          │  WhatsApp   │
    │Dashboard │          │Notification │
    │Shows New │          │"Reply YES"  │
    │Booking   │          │"or NO"      │
    └────┬─────┘          └──────┬──────┘
         │                       │
         │ Clicks Accept         │ Vendor Replies
         │                       │
         └───────────┬───────────┘
                     ↓
         ┌───────────────────────┐
         │ acceptAndAssignResources()│
         │  (SAME FUNCTION!)     │
         └───────────┬───────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │ Check Driver/Vehicle  │
         │    Availability       │
         └───────────┬───────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │  Update Assignment:   │
         │  - driver_id          │
         │  - vehicle_id         │
         │  - status='accepted'  │
         └───────────┬───────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │ Create resource_      │
         │ schedules entries     │
         └───────────┬───────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │  Send Notifications:  │
         │  - Customer           │
         │  - Admin              │
         │  - Vendor             │
         └───────────────────────┘
```

### WhatsApp Automation Detailed Flow

```
Booking Created (Customer OR Business)
         ↓
   [Trigger: on_booking_insert]
         ↓
Query vendor_categories for matching vehicle category
  ORDER BY priority DESC, rating DESC
         ↓
Get First Vendor (Vendor A)
         ↓
Create booking_assignment:
  - vendor_id = A
  - status = 'pending'
  - attempt_number = 1
  - timeout_at = NOW() + 10 minutes
  - is_automated = true
         ↓
Send WhatsApp:
  "New booking #12345
   Route: Airport → Hotel
   Date: Dec 15, 2:00 PM
   Vehicle: Luxury Sedan
   Price: $150

   Reply YES-{assignment_id} to accept
   Reply NO-{assignment_id} to reject"
         ↓
    ┌─────────────────┴─────────────────┐
    ↓                                   ↓
Vendor Replies "NO"            Vendor Replies "YES"
    ↓                                   ↓
Update assignment:                Send WhatsApp:
  status='rejected'                "Available Drivers:
  rejection_reason='manual'         1. Ali Ahmed (4.8⭐)
    ↓                                2. Omar Hassan (4.9⭐)
Get Next Vendor (Vendor B)          3. Khalid Ibrahim (4.7⭐)
    ↓
Create new assignment:             Reply 1, 2, or 3"
  vendor_id = B                         ↓
  attempt_number = 2               Vendor Replies "2"
  timeout_at = NOW() + 10min            ↓
    ↓                              Parse driver selection
Send WhatsApp to Vendor B               ↓
    ↓                              acceptAndAssignResources(
  (Repeat)                           assignment_id,
                                     driver_id=omar_id,
                                     vehicle_id=auto_selected
                                   )
                                        ↓
                                   Update assignment:
                                     driver_id = omar_id
                                     vehicle_id = sedan_123
                                     status = 'accepted'
                                        ↓
                                   Create resource_schedules
                                        ↓
                                   Send Notifications:
                                     - WhatsApp to Customer:
                                       "Booking confirmed!
                                        Driver: Omar Hassan
                                        Vehicle: Mercedes S-Class"
                                     - Notification to Admin
                                     - WhatsApp to Vendor:
                                       "Assignment confirmed"

┌──────────────────────────────────────┐
│         TIMEOUT HANDLER              │
│    (Background Job - Every Minute)   │
└──────────────────────────────────────┘
         ↓
Query assignments WHERE:
  status='pending' AND
  timeout_at < NOW()
         ↓
For each timed-out assignment:
  - Update status='rejected'
  - rejection_reason='timeout'
  - Get next vendor in category
  - Create new assignment (attempt_number++)
  - Send WhatsApp to next vendor
```

---

## 💻 Code Implementation

### Phase 1: Core Polymorphic Support (Manual Workflows)

#### 1.1 Helper Functions (`lib/bookings/unified-service.ts`)

```typescript
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';

type BookingType = 'customer' | 'business';

interface UnifiedBooking {
  id: string;
  bookingType: BookingType;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupDatetime: string;
  fromLocationId: string;
  toLocationId: string;
  vehicleTypeId: string;
  totalPrice: number;
  bookingStatus: string;
  // ... other common fields
}

/**
 * Get booking details regardless of type (customer or business)
 */
export async function getUnifiedBookingDetails(
  bookingId?: string,
  businessBookingId?: string
): Promise<UnifiedBooking | null> {
  const supabase = await createClient();

  if (bookingId) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        from_locations:from_location_id(name, city),
        to_locations:to_location_id(name, city),
        vehicle_types:vehicle_type_id(name, vehicle_categories:category_id(name))
      `)
      .eq('id', bookingId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      bookingType: 'customer',
      bookingNumber: data.booking_number,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerPhone: data.customer_phone,
      pickupDatetime: data.pickup_datetime,
      fromLocationId: data.from_location_id,
      toLocationId: data.to_location_id,
      vehicleTypeId: data.vehicle_type_id,
      totalPrice: data.total_price,
      bookingStatus: data.booking_status,
      // ... map other fields
    } as UnifiedBooking;
  }

  if (businessBookingId) {
    const { data, error } = await supabase
      .from('business_bookings')
      .select(`
        *,
        from_locations:from_location_id(name, city),
        to_locations:to_location_id(name, city),
        vehicle_types:vehicle_type_id(name, vehicle_categories:category_id(name))
      `)
      .eq('id', businessBookingId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      bookingType: 'business',
      bookingNumber: data.booking_number,
      customerName: data.customer_name,
      customerEmail: data.customer_email || '',
      customerPhone: data.customer_phone || '',
      pickupDatetime: data.pickup_datetime,
      fromLocationId: data.from_location_id,
      toLocationId: data.to_location_id,
      vehicleTypeId: data.vehicle_type_id,
      totalPrice: data.total_price,
      bookingStatus: data.booking_status,
      // ... map other fields
    } as UnifiedBooking;
  }

  return null;
}

/**
 * Get booking details from assignment ID
 */
export async function getBookingFromAssignment(assignmentId: string): Promise<UnifiedBooking | null> {
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from('booking_assignments')
    .select('booking_id, business_booking_id')
    .eq('id', assignmentId)
    .single();

  if (!assignment) return null;

  return getUnifiedBookingDetails(assignment.booking_id, assignment.business_booking_id);
}

/**
 * Create booking assignment (works for both types)
 */
export async function createBookingAssignment(params: {
  bookingId?: string;
  businessBookingId?: string;
  vendorId: string;
  assignedBy: string;
  isAutomated?: boolean;
  attemptNumber?: number;
  timeoutMinutes?: number;
}) {
  const supabase = await createClient();

  const assignment = {
    booking_id: params.bookingId || null,
    business_booking_id: params.businessBookingId || null,
    vendor_id: params.vendorId,
    assigned_by: params.assignedBy,
    status: 'pending',
    assigned_at: new Date().toISOString(),
    is_automated: params.isAutomated || false,
    attempt_number: params.attemptNumber || 1,
    timeout_at: params.timeoutMinutes
      ? new Date(Date.now() + params.timeoutMinutes * 60000).toISOString()
      : null,
  };

  const { data, error } = await supabase
    .from('booking_assignments')
    .insert(assignment)
    .select()
    .single();

  return { data, error };
}

/**
 * Get all bookings (customer + business) for admin view
 */
export async function getUnifiedBookingsList(filters?: {
  status?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  // Query customer bookings
  let customerQuery = supabase
    .from('bookings')
    .select(`
      id,
      booking_number,
      customer_name,
      customer_email,
      pickup_datetime,
      booking_status,
      total_price,
      from_locations:from_location_id(name),
      to_locations:to_location_id(name),
      vehicle_types:vehicle_type_id(name)
    `, { count: 'exact' });

  // Query business bookings
  let businessQuery = supabase
    .from('business_bookings')
    .select(`
      id,
      booking_number,
      customer_name,
      customer_email,
      pickup_datetime,
      booking_status,
      total_price,
      from_locations:from_location_id(name),
      to_locations:to_location_id(name),
      vehicle_types:vehicle_type_id(name)
    `, { count: 'exact' });

  // Apply filters
  if (filters?.status) {
    customerQuery = customerQuery.eq('booking_status', filters.status);
    businessQuery = businessQuery.eq('booking_status', filters.status);
  }

  if (filters?.fromDate) {
    customerQuery = customerQuery.gte('pickup_datetime', filters.fromDate);
    businessQuery = businessQuery.gte('pickup_datetime', filters.fromDate);
  }

  if (filters?.toDate) {
    customerQuery = customerQuery.lte('pickup_datetime', filters.toDate);
    businessQuery = businessQuery.lte('pickup_datetime', filters.toDate);
  }

  if (filters?.search) {
    customerQuery = customerQuery.or(`customer_name.ilike.%${filters.search}%,booking_number.ilike.%${filters.search}%`);
    businessQuery = businessQuery.or(`customer_name.ilike.%${filters.search}%,booking_number.ilike.%${filters.search}%`);
  }

  // Execute queries
  const [customerResult, businessResult] = await Promise.all([
    customerQuery,
    businessQuery,
  ]);

  // Combine results
  const customerBookings = (customerResult.data || []).map(b => ({
    ...b,
    bookingType: 'customer' as const,
  }));

  const businessBookings = (businessResult.data || []).map(b => ({
    ...b,
    bookingType: 'business' as const,
  }));

  const allBookings = [...customerBookings, ...businessBookings]
    .sort((a, b) => new Date(b.pickup_datetime).getTime() - new Date(a.pickup_datetime).getTime());

  return {
    bookings: allBookings,
    totalCount: (customerResult.count || 0) + (businessResult.count || 0),
  };
}
```

#### 1.2 Update Admin Actions (`app/admin/bookings/actions.ts`)

```typescript
import { getUnifiedBookingsList, createBookingAssignment } from '@/lib/bookings/unified-service';

/**
 * Get all bookings (replaces existing getBookings)
 */
export async function getBookings(filters?: {
  status?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const limit = filters?.limit || 25;
  const offset = ((filters?.page || 1) - 1) * limit;

  const { bookings, totalCount } = await getUnifiedBookingsList({
    ...filters,
    limit,
    offset,
  });

  return {
    bookings,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}

/**
 * Assign booking to vendor (works for both types)
 */
export async function assignBookingToVendor(
  bookingId: string,
  bookingType: 'customer' | 'business',
  vendorId: string,
  adminUserId: string
) {
  const { data, error } = await createBookingAssignment({
    bookingId: bookingType === 'customer' ? bookingId : undefined,
    businessBookingId: bookingType === 'business' ? bookingId : undefined,
    vendorId,
    assignedBy: adminUserId,
    isAutomated: false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Send notification to vendor (existing code)
  // ...

  return { success: true, assignment: data };
}
```

#### 1.3 Update Vendor Actions (`app/vendor/bookings/actions.ts`)

```typescript
import { getBookingFromAssignment } from '@/lib/bookings/unified-service';

/**
 * Get vendor's assigned bookings (updated to handle both types)
 */
export async function getVendorAssignedBookings(vendorId: string, status?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('booking_assignments')
    .select(`
      *,
      vendor:vendor_applications(business_name),
      driver:vendor_drivers(first_name, last_name),
      vehicle:vehicles(registration_number, make, model)
    `)
    .eq('vendor_id', vendorId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: assignments, error } = await query.order('assigned_at', { ascending: false });

  if (error || !assignments) {
    return { bookings: [], error };
  }

  // Fetch booking details for each assignment
  const bookingsWithDetails = await Promise.all(
    assignments.map(async (assignment) => {
      const booking = await getBookingFromAssignment(assignment.id);
      return {
        assignment,
        booking,
      };
    })
  );

  return { bookings: bookingsWithDetails, error: null };
}

/**
 * Accept assignment and assign resources
 * (NO CHANGES NEEDED - already works with assignment_id)
 */
export async function acceptAndAssignResources(
  assignmentId: string,
  driverId: string,
  vehicleId: string,
  vendorId: string
) {
  // Existing implementation works perfectly!
  // It operates on assignment_id, doesn't care about booking type
  // ...existing code...
}
```

#### 1.4 Admin UI Updates (`app/admin/bookings/components/bookings-table.tsx`)

```typescript
// Add booking type column
<TableHead>Type</TableHead>

// In table body
<TableCell>
  <Badge variant={booking.bookingType === 'customer' ? 'default' : 'secondary'}>
    {booking.bookingType === 'customer' ? 'Customer' : 'Business'}
  </Badge>
</TableCell>
```

---

### Phase 2: WhatsApp Automation (Future Implementation)

#### 2.1 Database Trigger for Auto-Assignment

```sql
-- Trigger on customer bookings
CREATE OR REPLACE FUNCTION trigger_auto_assign_customer_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-assign if enabled for this booking
  IF NEW.auto_assign = true THEN
    PERFORM auto_assign_booking_to_vendors(NEW.id, NULL, NEW.vehicle_type_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_customer_booking_created
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_auto_assign_customer_booking();

-- Trigger on business bookings
CREATE OR REPLACE FUNCTION trigger_auto_assign_business_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-assign if enabled for this booking
  IF NEW.auto_assign = true THEN
    PERFORM auto_assign_booking_to_vendors(NULL, NEW.id, NEW.vehicle_type_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_business_booking_created
AFTER INSERT ON business_bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_auto_assign_business_booking();
```

#### 2.2 Auto-Assignment Function

```sql
CREATE OR REPLACE FUNCTION auto_assign_booking_to_vendors(
  p_booking_id UUID DEFAULT NULL,
  p_business_booking_id UUID DEFAULT NULL,
  p_vehicle_type_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_category_id UUID;
  v_vendor_id UUID;
  v_assignment_id UUID;
BEGIN
  -- Get vehicle category
  SELECT category_id INTO v_category_id
  FROM vehicle_types
  WHERE id = p_vehicle_type_id;

  -- Get first vendor in queue
  SELECT vendor_id INTO v_vendor_id
  FROM vendor_categories
  WHERE category_id = v_category_id
    AND is_active = true
  ORDER BY priority DESC, rating DESC
  LIMIT 1;

  IF v_vendor_id IS NULL THEN
    RAISE EXCEPTION 'No vendors available for category %', v_category_id;
  END IF;

  -- Create assignment
  INSERT INTO booking_assignments (
    booking_id,
    business_booking_id,
    vendor_id,
    status,
    assigned_at,
    attempt_number,
    timeout_at,
    is_automated
  ) VALUES (
    p_booking_id,
    p_business_booking_id,
    v_vendor_id,
    'pending',
    NOW(),
    1,
    NOW() + INTERVAL '10 minutes',
    true
  )
  RETURNING id INTO v_assignment_id;

  -- Notify webhook system to send WhatsApp
  PERFORM pg_notify('whatsapp_assignment', json_build_object(
    'assignment_id', v_assignment_id,
    'vendor_id', v_vendor_id,
    'action', 'send_initial'
  )::text);

  RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql;
```

#### 2.3 WhatsApp Webhook Endpoint (`app/api/webhooks/whatsapp/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBookingFromAssignment } from '@/lib/bookings/unified-service';
import { acceptAndAssignResources } from '@/app/vendor/bookings/actions';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Verify WhatsApp webhook signature
    // ... security validation ...

    const { from, message } = payload;
    const messageText = message.text.toUpperCase();

    // Extract assignment ID from message
    const assignmentMatch = messageText.match(/(?:YES|NO)-([a-f0-9-]{36})/i);
    if (!assignmentMatch) {
      return NextResponse.json({ success: false, error: 'Invalid format' });
    }

    const assignmentId = assignmentMatch[1];
    const supabase = await createClient();

    // Get assignment
    const { data: assignment } = await supabase
      .from('booking_assignments')
      .select('*, vendor:vendor_applications(whatsapp_number)')
      .eq('id', assignmentId)
      .single();

    if (!assignment || assignment.vendor.whatsapp_number !== from) {
      return NextResponse.json({ success: false, error: 'Invalid assignment' });
    }

    // Handle response
    if (messageText.startsWith('YES')) {
      await handleAcceptance(assignmentId, from);
    } else if (messageText.startsWith('NO')) {
      await handleRejection(assignmentId, from);
    } else if (messageText.match(/^\d+$/)) {
      // Driver selection (number only)
      await handleDriverSelection(assignmentId, parseInt(messageText), from);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ success: false, error: 'Processing failed' }, { status: 500 });
  }
}

async function handleAcceptance(assignmentId: string, whatsappNumber: string) {
  const supabase = await createClient();

  // Update assignment status
  await supabase
    .from('booking_assignments')
    .update({
      status: 'awaiting_driver_selection',
      accepted_at: new Date().toISOString()
    })
    .eq('id', assignmentId);

  // Get available drivers for this vendor
  const { data: assignment } = await supabase
    .from('booking_assignments')
    .select('vendor_id')
    .eq('id', assignmentId)
    .single();

  const { data: drivers } = await supabase
    .from('vendor_drivers')
    .select('id, first_name, last_name, rating')
    .eq('vendor_id', assignment.vendor_id)
    .eq('is_active', true)
    .order('rating', { ascending: false });

  // Format driver list
  const driverList = drivers
    .map((d, i) => `${i + 1}. ${d.first_name} ${d.last_name} (${d.rating}⭐)`)
    .join('\n');

  // Send WhatsApp with driver options
  await sendWhatsApp(whatsappNumber, `
🚗 Great! Please select a driver:

${driverList}

Reply with the number (1, 2, 3...)
Assignment ID: ${assignmentId}
  `.trim());

  // Store driver mapping in cache for quick lookup
  await storeDriverMapping(assignmentId, drivers);
}

async function handleRejection(assignmentId: string, whatsappNumber: string) {
  const supabase = await createClient();

  // Update current assignment
  await supabase
    .from('booking_assignments')
    .update({
      status: 'rejected',
      rejection_reason: 'vendor_declined'
    })
    .eq('id', assignmentId);

  // Get booking details to find next vendor
  const booking = await getBookingFromAssignment(assignmentId);
  if (!booking) return;

  // Get current attempt number
  const { data: currentAssignment } = await supabase
    .from('booking_assignments')
    .select('attempt_number, booking_id, business_booking_id')
    .eq('id', assignmentId)
    .single();

  // Get already-tried vendors
  const { data: previousAttempts } = await supabase
    .from('booking_assignments')
    .select('vendor_id')
    .or(`booking_id.eq.${currentAssignment.booking_id},business_booking_id.eq.${currentAssignment.business_booking_id}`)
    .in('status', ['rejected', 'timeout']);

  const triedVendorIds = previousAttempts.map(a => a.vendor_id);

  // Get next vendor
  const { data: nextVendor } = await supabase
    .from('vendor_categories')
    .select('vendor_id, vendor:vendor_applications(whatsapp_number, business_name)')
    .eq('category_id', booking.vehicleTypeId)
    .eq('is_active', true)
    .not('vendor_id', 'in', `(${triedVendorIds.join(',')})`)
    .order('priority', { ascending: false })
    .order('rating', { ascending: false })
    .limit(1)
    .single();

  if (!nextVendor) {
    // No more vendors - notify admin
    await notifyAdminNoVendors(assignmentId);
    return;
  }

  // Create new assignment for next vendor
  const { data: newAssignment } = await supabase
    .from('booking_assignments')
    .insert({
      booking_id: currentAssignment.booking_id,
      business_booking_id: currentAssignment.business_booking_id,
      vendor_id: nextVendor.vendor_id,
      status: 'pending',
      assigned_at: new Date().toISOString(),
      attempt_number: currentAssignment.attempt_number + 1,
      timeout_at: new Date(Date.now() + 10 * 60000).toISOString(),
      is_automated: true,
    })
    .select()
    .single();

  // Send WhatsApp to next vendor
  await sendInitialWhatsApp(newAssignment.id, nextVendor.vendor.whatsapp_number, booking);
}

async function handleDriverSelection(assignmentId: string, driverNumber: number, whatsappNumber: string) {
  const supabase = await createClient();

  // Get driver from mapping
  const drivers = await getDriverMapping(assignmentId);
  const selectedDriver = drivers[driverNumber - 1];

  if (!selectedDriver) {
    await sendWhatsApp(whatsappNumber, '❌ Invalid driver number. Please try again.');
    return;
  }

  // Get vendor's default vehicle (or let admin assign later)
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('vendor_id', (await supabase.from('booking_assignments').select('vendor_id').eq('id', assignmentId).single()).data.vendor_id)
    .eq('is_available', true)
    .limit(1)
    .single();

  // Call existing acceptance function
  const result = await acceptAndAssignResources(
    assignmentId,
    selectedDriver.id,
    vehicle?.id || null, // Vehicle can be assigned later
    (await supabase.from('booking_assignments').select('vendor_id').eq('id', assignmentId).single()).data.vendor_id
  );

  if (result.success) {
    // Get booking details for confirmation message
    const booking = await getBookingFromAssignment(assignmentId);

    await sendWhatsApp(whatsappNumber, `
✅ Assignment Confirmed!

Driver: ${selectedDriver.first_name} ${selectedDriver.last_name}
Booking: ${booking.bookingNumber}
Route: ${booking.fromLocation} → ${booking.toLocation}
Date: ${new Date(booking.pickupDatetime).toLocaleString()}

The customer has been notified.
    `.trim());

    // Send notification to customer
    await notifyCustomer(booking, selectedDriver);
  }
}

// Helper functions
async function sendWhatsApp(to: string, message: string) {
  // Integration with WhatsApp Business API
  // ... implementation ...
}

async function sendInitialWhatsApp(assignmentId: string, whatsappNumber: string, booking: any) {
  await sendWhatsApp(whatsappNumber, `
🚗 New Booking Assignment

Booking: ${booking.bookingNumber}
Route: ${booking.fromLocation} → ${booking.toLocation}
Date: ${new Date(booking.pickupDatetime).toLocaleString()}
Vehicle: ${booking.vehicleType}
Price: $${booking.totalPrice}

Reply:
YES-${assignmentId} to accept
NO-${assignmentId} to reject

⏰ This assignment expires in 10 minutes
  `.trim());
}
```

#### 2.4 Timeout Handler (Background Job)

```typescript
// lib/automation/timeout-handler.ts
import { createClient } from '@/lib/supabase/server';

export async function processTimeouts() {
  const supabase = await createClient();

  // Find timed-out assignments
  const { data: timedOut } = await supabase
    .from('booking_assignments')
    .select('*')
    .eq('status', 'pending')
    .lt('timeout_at', new Date().toISOString())
    .eq('is_automated', true);

  for (const assignment of timedOut || []) {
    // Mark as rejected
    await supabase
      .from('booking_assignments')
      .update({
        status: 'rejected',
        rejection_reason: 'timeout',
      })
      .eq('id', assignment.id);

    // Trigger next vendor assignment (same logic as handleRejection)
    await assignToNextVendor(assignment);
  }
}

// Run via cron job every minute
// Can use Supabase Edge Functions with pg_cron or external service
```

---

## 📋 Implementation Phases

### Phase 1: Manual Workflows (Current Sprint)
**Goal:** Admin can view and assign business bookings manually

**Tasks:**
1. ✅ Database migration (add business_booking_id, create vendor_categories)
2. ✅ Create unified booking helper functions
3. ✅ Update admin bookings list to show both types
4. ✅ Add "Booking Type" badge to admin UI
5. ✅ Update admin actions to handle polymorphic IDs
6. ✅ Update vendor actions to query both booking types
7. ✅ Test end-to-end manual assignment flow
8. ✅ Update booking detail pages (admin side)

**Deliverables:**
- Admin can see business bookings in main list
- Admin can assign business bookings to vendors
- Vendors see unified list (customer + business)
- Vendors can accept and assign drivers (same flow)

**Estimated Time:** 2-3 days
**Risk Level:** LOW (no breaking changes)

---

### Phase 2: Vendor Categories Setup (Quick Win)
**Goal:** Admin can configure which vendors handle which vehicle categories

**Tasks:**
1. ✅ Create vendor categories management UI in admin
2. ✅ Add category selection to vendor application form
3. ✅ Populate vendor_categories table with initial data
4. ✅ Add priority/rating fields to vendor profiles

**Deliverables:**
- Admin UI for managing vendor-category relationships
- Foundation for automated vendor queue

**Estimated Time:** 1 day
**Risk Level:** LOW

---

### Phase 3: WhatsApp Integration Setup (Future)
**Goal:** Send and receive WhatsApp messages

**Tasks:**
1. ⏳ Set up WhatsApp Business API account
2. ⏳ Create webhook endpoint for receiving messages
3. ⏳ Implement sendWhatsApp utility function
4. ⏳ Test message delivery and reception
5. ⏳ Add vendor WhatsApp numbers to vendor_applications table

**Deliverables:**
- Working WhatsApp send/receive infrastructure
- Vendor WhatsApp numbers configured

**Estimated Time:** 2-3 days
**Risk Level:** MEDIUM (external API dependency)

---

### Phase 4: Automated Assignment Logic (Future)
**Goal:** Automatically assign bookings to vendors via WhatsApp

**Tasks:**
1. ⏳ Create database triggers for auto-assignment
2. ⏳ Implement auto_assign_booking_to_vendors function
3. ⏳ Create vendor queue ordering logic
4. ⏳ Implement WhatsApp message handlers (YES/NO/driver selection)
5. ⏳ Create timeout background job
6. ⏳ Implement "assign to next vendor" logic
7. ⏳ Add notification system for all parties

**Deliverables:**
- Fully automated vendor assignment workflow
- Sequential fallback on rejection/timeout
- WhatsApp-based driver selection
- Real-time notifications

**Estimated Time:** 4-5 days
**Risk Level:** MEDIUM-HIGH (complex state machine)

---

### Phase 5: Admin Controls & Monitoring (Future)
**Goal:** Admin can monitor and override automation

**Tasks:**
1. ⏳ Create automation dashboard (shows assignment attempts)
2. ⏳ Add "Manual Override" button to stop automation
3. ⏳ Create vendor performance metrics (acceptance rate, avg response time)
4. ⏳ Add admin notifications for "no vendors available"
5. ⏳ Create audit log for assignment history

**Deliverables:**
- Admin visibility into automation process
- Manual intervention capabilities
- Performance analytics

**Estimated Time:** 2-3 days
**Risk Level:** LOW

---

## 🧪 Testing Strategy

### Phase 1 Testing (Manual Workflows)

#### Unit Tests
- `getUnifiedBookingDetails()` with customer booking ID
- `getUnifiedBookingDetails()` with business booking ID
- `createBookingAssignment()` with customer booking
- `createBookingAssignment()` with business booking
- `getUnifiedBookingsList()` filters and pagination

#### Integration Tests
1. **Admin assigns customer booking:**
   - Create customer booking
   - Admin assigns to vendor
   - Verify booking_assignments row created with booking_id
   - Vendor sees assignment in dashboard

2. **Admin assigns business booking:**
   - Create business booking
   - Admin assigns to vendor
   - Verify booking_assignments row created with business_booking_id
   - Vendor sees assignment in dashboard

3. **Vendor accepts customer booking:**
   - Create assignment with booking_id
   - Vendor calls acceptAndAssignResources
   - Verify driver/vehicle assigned
   - Verify resource_schedules created

4. **Vendor accepts business booking:**
   - Create assignment with business_booking_id
   - Vendor calls acceptAndAssignResources
   - Verify driver/vehicle assigned
   - Verify resource_schedules created

#### Manual Testing Checklist
- [ ] Admin booking list shows both customer and business bookings
- [ ] "Booking Type" badge displays correctly
- [ ] Admin can filter by booking type
- [ ] Admin can assign customer booking to vendor
- [ ] Admin can assign business booking to vendor
- [ ] Vendor dashboard shows both booking types
- [ ] Vendor cannot distinguish between booking types (unified UX)
- [ ] Vendor can accept customer booking assignment
- [ ] Vendor can accept business booking assignment
- [ ] Booking detail page works for both types
- [ ] Notifications sent correctly for both types

---

### Phase 4 Testing (Automation)

#### Unit Tests
- `auto_assign_booking_to_vendors()` function
- Vendor queue ordering logic
- Timeout detection logic
- WhatsApp message parsing

#### Integration Tests
1. **Automated assignment - happy path:**
   - Create booking with auto_assign=true
   - Verify first vendor receives WhatsApp
   - Vendor replies "YES"
   - Verify driver list sent
   - Vendor selects driver
   - Verify assignment completed

2. **Rejection and fallback:**
   - Create booking
   - First vendor replies "NO"
   - Verify second vendor receives WhatsApp
   - Second vendor accepts
   - Verify assignment completed

3. **Timeout handling:**
   - Create booking
   - First vendor doesn't respond
   - Wait 10 minutes
   - Verify timeout job marks as rejected
   - Verify second vendor receives WhatsApp

4. **No vendors available:**
   - Create booking
   - All vendors reject
   - Verify admin receives notification
   - Verify booking status updated

#### Load Testing
- 100 bookings created simultaneously
- Verify assignments created for all
- Verify no duplicate assignments
- Verify timeout job handles load

---

## 🚨 Error Handling & Edge Cases

### Database Constraints
1. **Exactly one booking type referenced:**
   - CHECK constraint ensures booking_id XOR business_booking_id
   - Prevents invalid state

2. **Vendor availability:**
   - Before creating assignment, verify vendor is active
   - Check vendor isn't over capacity

3. **Duplicate assignments:**
   - Prevent multiple pending assignments for same booking
   - Use UNIQUE constraint or application logic

### Automation Edge Cases

1. **Vendor WhatsApp unreachable:**
   - Retry 3 times with exponential backoff
   - After 3 failures, skip to next vendor
   - Log issue for admin review

2. **Concurrent bookings for same driver:**
   - Check resource_schedules before accepting
   - Prevent double-booking

3. **Booking cancelled during assignment:**
   - Cancel all pending assignments
   - Send cancellation WhatsApp to vendors

4. **Vendor accepts but doesn't select driver:**
   - Status: 'awaiting_driver_selection'
   - Send reminder after 5 minutes
   - After 15 minutes, unassign and try next vendor

5. **Invalid driver selection:**
   - Send error message: "Invalid number, please try again"
   - Don't create new assignment

6. **All vendors reject:**
   - Status: 'unassigned'
   - Admin notification: "No vendors available for booking #123"
   - Admin can manually intervene

---

## 📊 Monitoring & Metrics

### Key Metrics to Track

1. **Assignment Performance:**
   - Average time to first vendor response
   - Average attempts before acceptance
   - Acceptance rate by vendor
   - Timeout rate

2. **Vendor Performance:**
   - Average response time
   - Acceptance rate
   - Cancellation rate after acceptance
   - Customer rating correlation

3. **System Health:**
   - WhatsApp delivery success rate
   - Webhook processing time
   - Timeout job execution frequency
   - Database query performance

### Alerts to Configure

1. **Critical:**
   - WhatsApp API down
   - 5+ bookings with no vendors available
   - Database constraint violations

2. **Warning:**
   - Vendor response time > 5 minutes
   - Timeout rate > 30%
   - 3+ assignment attempts for single booking

3. **Info:**
   - New booking auto-assigned
   - Vendor accepted assignment
   - All vendors rejected (admin notified)

---

## 🔒 Security Considerations

### WhatsApp Webhook Security
1. Verify webhook signature from WhatsApp
2. Validate sender WhatsApp number against vendor records
3. Rate limit webhook endpoint
4. Log all webhook requests for audit

### Database Security
1. RLS policies on booking_assignments
2. Vendor can only see their own assignments
3. Admin-only access to vendor_categories
4. Audit log for all assignment changes

### Data Privacy
1. Don't send sensitive customer data via WhatsApp
2. Use assignment IDs instead of booking IDs in messages
3. Encrypt WhatsApp message IDs in database
4. Comply with GDPR/data retention policies

---

## 📚 Documentation Updates Needed

1. **Admin User Guide:**
   - How to assign business bookings
   - Understanding booking types
   - Monitoring vendor performance

2. **Vendor User Guide:**
   - How to respond to WhatsApp assignments
   - Driver selection process
   - What happens if you reject

3. **API Documentation:**
   - WhatsApp webhook endpoint
   - Assignment status values
   - Error codes

4. **Developer Documentation:**
   - Polymorphic pattern explanation
   - Adding new booking types
   - Extending automation logic

---

## 🎯 Success Criteria

### Phase 1 (Manual)
- ✅ Business bookings visible in admin panel
- ✅ Admin can assign business bookings to vendors
- ✅ Vendor workflow identical for both booking types
- ✅ Zero code duplication in vendor actions
- ✅ No breaking changes to existing customer flow

### Phase 4 (Automation)
- ✅ 90%+ of bookings assigned within 10 minutes
- ✅ < 5% of bookings require admin intervention
- ✅ Vendor response time < 3 minutes average
- ✅ Timeout rate < 20%
- ✅ Zero duplicate assignments
- ✅ 100% notification delivery success

---

## 🔄 Rollback Plan

### If Phase 1 Issues Found
1. Drop `business_booking_id` column from booking_assignments
2. Remove vendor_categories table
3. Revert admin/vendor action changes
4. No data loss (customer bookings unaffected)

### If Phase 4 Issues Found
1. Disable auto-assignment triggers
2. Stop timeout background job
3. Fall back to manual assignment only
4. Existing assignments continue normally
5. No data loss (assignments remain valid)

---

## 📝 Notes

- **Code Reuse Achievement:** ~90% of vendor workflow code is reused between manual and automated flows
- **Vendor Simplicity:** Vendor sees one unified list, doesn't know/care about booking source
- **Future Extensibility:** Can add hotel bookings, airport transfers, etc. by just adding more polymorphic columns
- **No Breaking Changes:** Existing customer booking flow completely untouched
- **WhatsApp Automation:** Plugs directly into existing assignment flow, no workflow duplication

---

## ✅ Implementation Checklist

### Database
- [ ] Run migration to add business_booking_id column
- [ ] Create vendor_categories table
- [ ] Add automation-related columns (attempt_number, timeout_at, etc.)
- [ ] Create indexes for performance
- [ ] Create helper functions (get_booking_for_assignment, etc.)

### Backend
- [ ] Create `lib/bookings/unified-service.ts` with helper functions
- [ ] Update `app/admin/bookings/actions.ts` to use unified functions
- [ ] Update `app/vendor/bookings/actions.ts` to handle both types
- [ ] Add booking type parameter to assignment functions

### Frontend (Admin)
- [ ] Update bookings table to show booking type badge
- [ ] Add booking type filter
- [ ] Update assign vendor modal to pass booking type
- [ ] Update booking detail page to handle both types
- [ ] Create vendor categories management UI

### Frontend (Vendor)
- [ ] Verify vendor dashboard works with both types (should be automatic)
- [ ] Test acceptance flow for both types
- [ ] Verify no UI changes needed (unified experience)

### Testing
- [ ] Unit tests for all helper functions
- [ ] Integration tests for manual assignment flows
- [ ] Manual testing checklist completion
- [ ] Load testing for large datasets

### Documentation
- [ ] Update admin user guide
- [ ] Update vendor user guide
- [ ] Create Linear issue with full plan
- [ ] Update CLAUDE.md with new patterns

---

## 📞 Questions for Stakeholders

1. **Vendor Categories:**
   - Should we auto-populate vendor_categories based on existing vehicle types?
   - Or should admin manually configure this?

2. **WhatsApp:**
   - Do we have WhatsApp Business API account?
   - Do all vendors have WhatsApp numbers on file?

3. **Timeout Duration:**
   - Is 10 minutes reasonable for vendor response time?
   - Should this be configurable per booking priority?

4. **Priority Logic:**
   - How should we order vendors in queue?
   - Rating only, or rating + distance + availability?

5. **Admin Notifications:**
   - When should admin be notified during automation?
   - Only on failure, or at each step?

---

## 🎉 Benefits Summary

This unified booking assignment system achieves:

1. **Zero Code Duplication** - Vendor workflow is 90%+ reused
2. **Simple Vendor Experience** - One list, one workflow, no confusion
3. **Future-Ready** - WhatsApp automation plugs in seamlessly
4. **No Breaking Changes** - Existing customer flow untouched
5. **Extensible** - Can add more booking types easily
6. **Admin Visibility** - Full oversight of all bookings
7. **Scalable** - Handles automation at scale
8. **Maintainable** - Single source of truth for assignment logic

**"You think vendor don't know who is customer who is business side"** ✅ Achieved!
