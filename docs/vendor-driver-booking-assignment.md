# Vendor Driver Creation and Booking Assignment Documentation

## Table of Contents
1. [Overview](#overview)
2. [Driver Management](#driver-management)
3. [Booking Assignment Workflow](#booking-assignment-workflow)
4. [Database Schema](#database-schema)
5. [API Endpoints & Actions](#api-endpoints--actions)
6. [UI Components](#ui-components)
7. [Business Rules](#business-rules)
8. [Code Examples](#code-examples)

## Overview

The Vendor Driver and Booking Assignment system enables vendors to:
- Create and manage their driver roster
- Accept bookings assigned by administrators
- Assign drivers and vehicles to accepted bookings
- Track driver availability and employment status
- Manage the complete lifecycle of booking assignments

### System Architecture

```
Admin Dashboard
    ↓
Assigns Booking to Vendor
    ↓
Vendor Dashboard
    ↓
Vendor Accepts/Rejects Assignment
    ↓
Vendor Assigns Driver & Vehicle
    ↓
Booking Execution
```

## Driver Management

### Creating New Drivers

Vendors can add drivers through the vendor dashboard at `/vendor/drivers/new`. The system captures comprehensive driver information for operational and compliance purposes.

### Driver Data Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `first_name` | string | Yes | Driver's first name | Min 2 characters |
| `last_name` | string | Yes | Driver's last name | Min 2 characters |
| `phone` | string | Yes | Contact phone number | Min 10 digits |
| `email` | string | No | Email address | Valid email format |
| `license_number` | string | Yes | Driving license number | Min 5 characters |
| `license_expiry` | date | Yes | License expiration date | Must be future date |
| `license_type` | enum | Yes | Type of license | regular/commercial/heavy |
| `date_of_birth` | date | No | Driver's DOB | Must be past date |
| `address` | string | No | Residential address | Free text |
| `city` | string | No | City of residence | Free text |
| `country_code` | string | Yes | Country code | Default: AE |
| `emergency_contact_name` | string | No | Emergency contact name | Free text |
| `emergency_contact_phone` | string | No | Emergency contact phone | Free text |
| `joining_date` | date | No | Employment start date | Default: current date |
| `employment_status` | enum | Yes | Current employment status | active/inactive/on_leave/terminated |
| `is_available` | boolean | Yes | Availability for assignments | Default: true |
| `notes` | string | No | Additional notes | Free text |

### Driver Status Management

#### Employment Status Options:
- **Active**: Driver is actively employed and can be assigned
- **Inactive**: Temporarily unavailable
- **On Leave**: Driver is on official leave
- **Terminated**: No longer employed (soft delete)

#### Availability Status:
- **is_available**: Quick toggle for assignment availability
- **is_active**: System flag for soft deletion

## Booking Assignment Workflow

### 1. Assignment Creation (Admin Side)
Administrators assign bookings to vendors based on:
- Vehicle category compatibility
- Vendor location/service area
- Vendor availability
- Performance metrics

### 2. Vendor Assignment Management

#### Assignment States:
```
pending → accepted → completed
    ↓
rejected
```

#### Key Assignment Actions:

##### Accept & Assign Resources
When a vendor accepts an assignment, they must:
1. Select an available driver
2. Select an available vehicle
3. System checks for scheduling conflicts
4. Creates resource schedule entries
5. Updates assignment status to "accepted"

##### Reject Assignment
Vendors can reject assignments with:
- Optional rejection reason
- Updates assignment status to "rejected"
- Notifies admin dashboard
- Allows reassignment to another vendor

### 3. Resource Availability Checking

The system performs real-time availability checks:
- Queries `resource_schedules` table for conflicts
- Checks `resource_unavailability` periods
- Validates driver `is_available` status
- Validates vehicle `is_available` status
- Estimates trip duration (default: 2 hours)

## Database Schema

### vendor_drivers Table

```sql
CREATE TABLE vendor_drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor_applications(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    license_number TEXT NOT NULL,
    license_expiry DATE NOT NULL,
    license_type TEXT DEFAULT 'regular',
    date_of_birth DATE,
    address TEXT,
    city TEXT,
    country_code TEXT DEFAULT 'AE',
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    joining_date DATE DEFAULT CURRENT_DATE,
    employment_status TEXT DEFAULT 'active',
    documents JSONB DEFAULT '{}',
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### booking_assignments Table

```sql
CREATE TABLE booking_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    vendor_id UUID NOT NULL REFERENCES vendor_applications(id),
    driver_id UUID REFERENCES vendor_drivers(id),
    vehicle_id UUID REFERENCES vehicles(id),
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    rejection_reason TEXT,
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Key Relationships
- `vendor_drivers.vendor_id` → `vendor_applications.id`
- `booking_assignments.vendor_id` → `vendor_applications.id`
- `booking_assignments.driver_id` → `vendor_drivers.id`
- `booking_assignments.vehicle_id` → `vehicles.id`
- `booking_assignments.booking_id` → `bookings.id`

## API Endpoints & Actions

### Driver Management Actions

Located in `/app/vendor/drivers/actions.ts`:

#### Core Functions:

```typescript
// Get current vendor's ID
getCurrentVendorId(): Promise<string>

// CRUD Operations
getDrivers(): Promise<{ data: VendorDriver[], error: string | null }>
getDriver(driverId: string): Promise<{ data: VendorDriver, error: string | null }>
createDriver(formData: FormData): Promise<{ data: VendorDriver, error: string | null }>
updateDriver(driverId: string, formData: FormData): Promise<{ data: VendorDriver, error: string | null }>
deleteDriver(driverId: string): Promise<{ success: boolean, error: string | null }>

// Status Management
toggleDriverAvailability(driverId: string, isAvailable: boolean): Promise<{ success: boolean, error: string | null }>
updateDriverStatus(driverId: string, status: string): Promise<{ success: boolean, error: string | null }>

// Statistics
getDriverStats(): Promise<{ data: DriverStats, error: string | null }>
```

### Booking Assignment Actions

Located in `/app/vendor/bookings/actions.ts`:

#### Core Functions:

```typescript
// Get vendor's assigned bookings
getVendorAssignedBookings(): Promise<VendorBooking[]>

// Get available resources
getVendorDrivers(): Promise<VendorDriver[]>
getVendorVehicles(): Promise<Vehicle[]>

// Assignment management
acceptAndAssignResources(
  assignmentId: string,
  driverId: string,
  vehicleId: string
): Promise<{ success: boolean }>

rejectAssignment(
  assignmentId: string,
  reason?: string
): Promise<{ success: boolean }>

// Availability checking
checkResourceAvailabilityForBooking(
  assignmentId: string
): Promise<AvailabilityCheckResult>
```

## UI Components

### Driver Form Component
**Location**: `/app/vendor/drivers/components/driver-form.tsx`

**Features**:
- Multi-section form layout
- Real-time validation with Zod
- Date pickers for license expiry, DOB, joining date
- Dropdown selects for enums
- Toggle switches for availability
- Support for both create and edit modes

**Form Sections**:
1. Basic Information (name, phone, email, DOB)
2. License Information (number, expiry, type)
3. Address Information (address, city, country)
4. Emergency Contact
5. Employment Details (joining date, status, availability)
6. Additional Notes

### Bookings Table Component
**Location**: `/app/vendor/bookings/components/bookings-table.tsx`

**Features**:
- Displays all assigned bookings
- Status badges with icons
- Customer information display
- Pickup/dropoff route display
- Driver/vehicle assignment status
- Action dropdown menus
- Integration with assignment modals

**Actions Available**:
- Accept & Assign (for pending bookings)
- Reject Assignment (for pending bookings)
- Assign Resources (for accepted without resources)
- Change Assignment (for already assigned)

### Assignment Modals
1. **AssignResourcesModal**: Select driver and vehicle with availability checking
2. **RejectAssignmentModal**: Provide rejection reason

## Business Rules

### Driver Creation Rules
1. License expiry must be a future date
2. Email is optional but must be valid if provided
3. Phone number minimum 10 digits
4. Default employment status is "active"
5. Default availability is true
6. Joining date defaults to current date

### Assignment Rules
1. Vendors can only manage their own drivers
2. Vendors can only see bookings assigned to them
3. Assignment status transitions are unidirectional (no reverting)
4. Rejected assignments cannot be re-accepted
5. Driver and vehicle must be available at booking time
6. Vehicle category must match booking requirements

### Availability Rules
1. Drivers marked as "terminated" are soft-deleted (is_active = false)
2. Unavailable drivers cannot be assigned to new bookings
3. System checks for scheduling conflicts before assignment
4. Default trip duration estimate is 2 hours
5. Both driver and vehicle availability are checked independently

### Security Rules
1. All operations require authenticated vendor user
2. Vendor must have approved application status
3. Cross-vendor data access is prevented via RLS
4. Sensitive operations use admin client for bypass when necessary

## Code Examples

### Creating a New Driver

```typescript
// In a Server Component
import { createDriver } from '@/app/vendor/drivers/actions'

// Prepare form data
const formData = new FormData()
formData.append('first_name', 'John')
formData.append('last_name', 'Doe')
formData.append('phone', '+971501234567')
formData.append('email', 'john.doe@example.com')
formData.append('license_number', 'DL123456')
formData.append('license_expiry', '2025-12-31')
formData.append('license_type', 'commercial')
formData.append('is_available', 'true')

// Create the driver
const result = await createDriver(formData)

if (result.error) {
  console.error('Failed to create driver:', result.error)
} else {
  console.log('Driver created:', result.data)
}
```

### Accepting a Booking Assignment

```typescript
import { acceptAndAssignResources } from '@/app/vendor/bookings/actions'

// Accept assignment and assign resources
const result = await acceptAndAssignResources(
  'assignment-uuid',  // Assignment ID
  'driver-uuid',      // Selected driver ID
  'vehicle-uuid'      // Selected vehicle ID
)

if (result.success) {
  // Assignment accepted and resources assigned
  // System automatically:
  // 1. Updates assignment status to "accepted"
  // 2. Records driver and vehicle IDs
  // 3. Creates schedule entries
  // 4. Updates availability calendars
}
```

### Checking Resource Availability

```typescript
import { checkResourceAvailabilityForBooking } from '@/app/vendor/bookings/actions'

// Check which drivers and vehicles are available
const availability = await checkResourceAvailabilityForBooking('assignment-uuid')

// Returns structure:
// {
//   bookingTime: "2025-01-20T10:00:00Z",
//   estimatedEndTime: "2025-01-20T12:00:00Z",
//   drivers: [
//     {
//       ...driverData,
//       availability: {
//         available: true/false,
//         conflicts: [...scheduling conflicts]
//       }
//     }
//   ],
//   vehicles: [...similar structure]
// }

// Filter available resources
const availableDrivers = availability.drivers.filter(
  d => d.availability.available
)
const availableVehicles = availability.vehicles.filter(
  v => v.availability.available
)
```

### Updating Driver Status

```typescript
import { updateDriverStatus, toggleDriverAvailability } from '@/app/vendor/drivers/actions'

// Change employment status
await updateDriverStatus('driver-uuid', 'on_leave')

// Toggle availability
await toggleDriverAvailability('driver-uuid', false)

// Soft delete a driver
await deleteDriver('driver-uuid')
// This sets is_active = false and employment_status = 'terminated'
```

### Rejecting an Assignment

```typescript
import { rejectAssignment } from '@/app/vendor/bookings/actions'

// Reject with reason
const result = await rejectAssignment(
  'assignment-uuid',
  'Vehicle not available for the requested time'
)

// System automatically:
// 1. Updates status to "rejected"
// 2. Records rejection reason
// 3. Sets rejected_at timestamp
// 4. Notifies admin for reassignment
```

## Best Practices

### Data Validation
- Always validate on both client (React Hook Form + Zod) and server
- Use TypeScript interfaces for type safety
- Implement proper error handling with user-friendly messages

### Performance
- Use server components for data fetching
- Implement pagination for large driver lists
- Cache vendor application data where possible
- Use `revalidatePath` for cache invalidation

### User Experience
- Provide clear status indicators
- Show availability conflicts before submission
- Implement loading states during operations
- Use toast notifications for action feedback

### Security
- Never expose vendor IDs in URLs
- Validate vendor ownership on all operations
- Use RLS policies for database security
- Sanitize all user inputs

## Troubleshooting

### Common Issues

1. **Driver not appearing in assignment list**
   - Check `is_active` = true
   - Check `is_available` = true
   - Verify employment_status is "active"
   - Ensure no scheduling conflicts

2. **Cannot accept assignment**
   - Verify vendor application is approved
   - Check assignment is in "pending" status
   - Ensure assignment belongs to your vendor account

3. **Availability check shows no resources**
   - Verify resources exist in database
   - Check vehicle category matches booking
   - Review scheduling conflicts
   - Confirm resource availability flags

4. **Form submission errors**
   - Validate all required fields are filled
   - Check date formats (yyyy-MM-dd)
   - Verify license expiry is future date
   - Ensure phone number meets minimum length

## Related Documentation
- [Vendor Dashboard Overview](./vendor-dashboard.md)
- [Vehicle Management](./vendor-vehicles.md)
- [Booking System Architecture](./booking-system.md)
- [Availability Management](./availability-management.md)