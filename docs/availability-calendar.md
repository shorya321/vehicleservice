# Availability Calendar Documentation

## Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints & Server Actions](#api-endpoints--server-actions)
6. [UI Components](#ui-components)
7. [User Workflows](#user-workflows)
8. [Business Logic](#business-logic)
9. [Data Flow](#data-flow)
10. [Recent Improvements](#recent-improvements)
11. [Integration Points](#integration-points)
12. [Best Practices](#best-practices)
13. [Code Examples](#code-examples)
14. [Troubleshooting Guide](#troubleshooting-guide)

## Overview

The Vendor Availability Calendar is a comprehensive scheduling and resource management system that provides vendors with a visual interface to manage their vehicles and drivers. Built on react-big-calendar, it offers real-time visibility into bookings, unavailability periods, and resource allocation.

### Purpose

The calendar serves as the central hub for vendors to:
- **Visualize Bookings**: See all accepted bookings with assigned resources
- **Manage Availability**: Mark vehicles and drivers as unavailable for maintenance, leave, etc.
- **Prevent Conflicts**: Avoid double-booking resources
- **Track Resources**: Monitor which vehicles and drivers are assigned to which bookings
- **Plan Ahead**: View current and upcoming schedules to make informed decisions

### Role in Vendor Operations

The availability calendar integrates directly with the booking assignment workflow:
1. Admin assigns booking to vendor
2. Vendor accepts and assigns driver/vehicle
3. System creates schedule entries
4. Calendar displays bookings visually
5. Vendor can mark additional unavailability
6. System prevents conflicts automatically

### Key Benefits

- **Real-time Visibility**: See all schedules at a glance
- **Conflict Prevention**: Automatic detection of scheduling conflicts
- **Resource Optimization**: Better allocation of vehicles and drivers
- **Historical Context**: View current and future bookings (past bookings hidden by design)
- **Flexible Views**: Switch between month, week, and day views
- **Smart Filtering**: Filter by resource type or specific vehicle/driver

## Key Features

### Calendar Views

The system supports three distinct viewing modes:

#### Month View
- Shows entire month at a glance
- Displays booking badges on specific dates
- Color-coded events (blue for bookings, red for unavailability)
- Quick navigation between months
- Default view on page load

#### Week View
- Shows 7-day schedule
- Hourly breakdown of availability
- Better visibility for time-specific events
- Ideal for day-to-day planning

#### Day View
- Shows single day schedule
- Detailed hourly timeline
- Precise time slot visibility
- Best for immediate operational planning

### Event Types

The calendar displays two primary event types:

#### Bookings (Blue Badges)
- Represent accepted booking assignments
- Single event per booking (combines vehicle + driver)
- Shows booking number as title
- Click to view detailed information:
  - Customer details (name, phone)
  - Pickup and dropoff addresses
  - Vehicle information (make, model, registration)
  - Driver information (name, phone)
  - Booking status

#### Unavailability Periods (Red Badges)
- Represent scheduled unavailability
- Separate events for each resource
- Shows resource name and reason
- Reasons include:
  - Maintenance
  - Leave
  - Sick
  - Training
  - Other
- Click to view and remove if needed

### Filtering System

The calendar provides powerful filtering capabilities:

#### Resource Type Filtering
- **All Resources**: Shows all bookings and unavailability
- **Vehicles**: Shows bookings (all) + vehicle unavailability only
- **Drivers**: Shows bookings (all) + driver unavailability only

#### Specific Resource Filtering
- Select individual vehicle or driver from dropdown
- Shows only events involving that specific resource
- Works for both bookings and unavailability periods
- "All" option to clear filter

### Navigation Controls

#### Time Period Navigation
- Previous/Next buttons for navigating through time
- Today button to jump to current date
- View selector (Month/Week/Day)

#### Smart Past Month Blocking
- Prevents navigation to months before current month
- Shows informative toast message when attempted
- Directs users to Bookings History for past records
- Design rationale: Calendar focuses on current and future planning

### Combined Booking Events

A key architectural decision to improve user experience:

#### Single Badge Per Booking
- Previous behavior: Two separate badges (vehicle + driver)
- Current behavior: One badge per booking
- Badge contains information for both resources
- Eliminates duplicate visual clutter
- Popup shows complete details for both vehicle and driver

#### Implementation
- Events grouped by `booking_assignment_id`
- First schedule used for timing (all schedules for same booking have identical times)
- Vehicle and driver details fetched and combined
- `resourceType` set to 'booking' instead of 'vehicle' or 'driver'

### Event Details Popup

Clicking any event opens a detailed dialog showing:

#### For Bookings:
- Booking number
- Date and time range
- Customer name and phone
- Pickup address
- Dropoff address
- Booking status
- Vehicle details (make, model, registration number)
- Driver details (name, phone)

#### For Unavailability:
- Resource name and type
- Reason for unavailability
- Date and time range
- Additional notes
- Option to remove unavailability

### Unavailability Management

Vendors can mark resources as unavailable through a dedicated form:

#### Process
1. Click "Mark Unavailable" button
2. Select resource type (Vehicle or Driver)
3. Select specific resource
4. Choose date range (start and end)
5. Select reason from predefined list
6. Add optional notes
7. System checks for conflicts
8. Creates unavailability record if no conflicts

#### Conflict Detection
- System checks for existing bookings during the period
- Prevents marking resources unavailable if bookings exist
- Shows clear error message with conflict details
- Ensures no disruption to accepted bookings

### Date Filtering

The calendar implements intelligent date filtering:

#### Current and Future Focus
- Only shows bookings from today onwards
- Hides all past bookings by default
- Applies to both bookings and unavailability periods
- Reduces visual clutter
- Focuses vendor attention on actionable schedules

#### Overlap Detection
- Events shown if they overlap with the viewed time period
- Proper boundary checking with `<=` and `>=` operators
- Example: September booking ending at 6:30 AM shows when viewing October if it extends into October

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Vendor Dashboard                        │
│                 /vendor/availability                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Availability Calendar Page                     │
│  - Fetches initial data (current month)                    │
│  - Renders AvailabilityCalendar component                  │
│  - Provides vendor and resource context                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           AvailabilityCalendar Component                    │
│  - react-big-calendar UI                                   │
│  - Event rendering and styling                             │
│  - Filtering logic (client-side)                           │
│  - Navigation controls                                      │
│  - Event click handlers                                     │
└────────────┬────────────────────┬──────────────────────────┘
             │                    │
             ▼                    ▼
┌─────────────────────┐  ┌───────────────────────┐
│  Server Actions     │  │  Availability Service │
│  (actions.ts)       │  │  (service.ts)         │
│                     │  │                       │
│  - Event fetching   │  │  - Business logic     │
│  - Resource lists   │  │  - Availability check │
│  - Mark unavailable │  │  - Conflict detection │
│  - Remove period    │  │  - Schedule CRUD      │
└─────────┬───────────┘  └───────────┬───────────┘
          │                          │
          └────────────┬─────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                        │
│  - resource_schedules                                       │
│  - resource_unavailability                                  │
│  - booking_assignments                                      │
│  - vehicles                                                 │
│  - vendor_drivers                                           │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
VendorLayout
  └── AvailabilityPage
        ├── Card (Calendar Container)
        │     └── AvailabilityCalendar
        │           ├── react-big-calendar
        │           ├── Filter Controls
        │           ├── Navigation Controls
        │           └── Event Details Dialog
        └── Mark Unavailable Button
              └── Unavailability Form Dialog
```

### Integration Points

- **Booking Assignment System**: Bookings appear after vendor accepts and assigns resources
- **Resource Management**: Integrates with vehicle and driver management modules
- **Schedule Service**: Uses `AvailabilityService` for business logic
- **Authentication**: Requires authenticated vendor user with approved application

### Data Flow

```
1. Page Load
   ├─→ Fetch vendor application
   ├─→ Calculate current month range
   ├─→ getVendorCalendarEvents(startDate, endDate)
   │     ├─→ getVendorSchedules() → Bookings from resource_schedules
   │     │     └─→ Group by booking_assignment_id
   │     │           └─→ Fetch booking, vehicle, driver details
   │     │                 └─→ Create single event per booking
   │     └─→ getVendorUnavailability() → Unavailability periods
   │           └─→ Fetch resource names
   │                 └─→ Create events for each period
   ├─→ getVendorResources()
   │     ├─→ Fetch vehicles list
   │     └─→ Fetch drivers list
   └─→ Render calendar with events and resources

2. User Interaction
   ├─→ Change month/week/day → Fetch new date range events
   ├─→ Apply filter → Client-side filtering of events
   ├─→ Click event → Show details dialog
   └─→ Mark unavailable → Check conflicts → Create period
```

## Database Schema

### resource_schedules Table

Tracks when vehicles and drivers are scheduled for bookings.

```sql
CREATE TABLE resource_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendor_applications(id),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('vehicle', 'driver')),
    resource_id UUID NOT NULL,
    booking_assignment_id UUID REFERENCES booking_assignments(id),
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Key Points
- **Two records per booking**: One for vehicle, one for driver
- **Same timing**: Both records have identical start/end times
- **Linked to assignment**: `booking_assignment_id` connects to booking details
- **Status tracking**: Shows booking lifecycle (booked → in_progress → completed)

#### Example Data
```
| id   | vendor_id | resource_type | resource_id      | booking_assignment_id | start_datetime      | end_datetime        | status  |
|------|-----------|---------------|------------------|-----------------------|---------------------|---------------------|---------|
| uuid | vendor-1  | vehicle       | vehicle-abc-123  | assignment-xyz        | 2025-01-20 10:00:00 | 2025-01-20 12:00:00 | booked  |
| uuid | vendor-1  | driver        | driver-def-456   | assignment-xyz        | 2025-01-20 10:00:00 | 2025-01-20 12:00:00 | booked  |
```

### resource_unavailability Table

Tracks when vehicles and drivers are marked as unavailable.

```sql
CREATE TABLE resource_unavailability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendor_applications(id),
    resource_type TEXT NOT NULL CHECK (resource_type IN ('vehicle', 'driver')),
    resource_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('maintenance', 'leave', 'sick', 'training', 'other')),
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Key Points
- **Vendor-specific**: Each vendor manages their own unavailability
- **Reason tracking**: Categorized reasons for reporting and analytics
- **Optional notes**: Additional context for the unavailability
- **Audit trail**: Tracks who created the unavailability period

#### Example Data
```
| id   | vendor_id | resource_type | resource_id     | reason      | start_datetime      | end_datetime        | notes                |
|------|-----------|---------------|-----------------|-------------|---------------------|---------------------|----------------------|
| uuid | vendor-1  | vehicle       | vehicle-abc-123 | maintenance | 2025-01-22 08:00:00 | 2025-01-22 17:00:00 | Scheduled oil change |
| uuid | vendor-1  | driver        | driver-def-456  | leave       | 2025-01-25 00:00:00 | 2025-01-27 23:59:59 | Annual vacation      |
```

### Related Tables

#### booking_assignments
- Links bookings to vendors
- Contains driver_id and vehicle_id
- Status tracking (pending, accepted, rejected, completed)
- Referenced by resource_schedules

#### vehicles
- Vehicle details (make, model, registration)
- Belongs to vendor (business_id)
- Availability status (is_available)
- Referenced by resource_schedules and resource_unavailability

#### vendor_drivers
- Driver details (name, phone, license)
- Belongs to vendor (vendor_id)
- Availability status (is_available)
- Referenced by resource_schedules and resource_unavailability

### Database Relationships

```
vendor_applications (1) → (N) resource_schedules
vendor_applications (1) → (N) resource_unavailability
booking_assignments (1) → (N) resource_schedules
vehicles (1) → (N) resource_schedules
vehicles (1) → (N) resource_unavailability
vendor_drivers (1) → (N) resource_schedules
vendor_drivers (1) → (N) resource_unavailability
```

## API Endpoints & Server Actions

### Server Actions (`app/vendor/availability/actions.ts`)

#### getVendorCalendarEvents(startDate?, endDate?)

Fetches all calendar events (bookings and unavailability) for a vendor within a date range.

**Parameters:**
```typescript
startDate?: string  // ISO date string for range start
endDate?: string    // ISO date string for range end
```

**Returns:**
```typescript
CalendarEvent[] // Array of calendar events

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resourceId: string
  resourceType: 'vehicle' | 'driver' | 'booking'
  type: 'booking' | 'unavailable'
  color?: string
  details?: any
}
```

**Process:**
1. Authenticates user and fetches vendor application
2. Fetches resource schedules (bookings) via `AvailabilityService.getVendorSchedules()`
3. Groups schedules by `booking_assignment_id`
4. For each booking group:
   - Fetches complete assignment with vehicle and driver details
   - Creates single event with combined information
   - Uses first schedule for timing (all schedules have same times)
5. Fetches unavailability periods via `AvailabilityService.getVendorUnavailability()`
6. For each unavailability period:
   - Fetches resource name (vehicle or driver)
   - Creates event with resource and reason
7. Returns combined array of events

**Key Implementation Detail:**
```typescript
// Group schedules by booking to create ONE event per booking
const bookingGroups = schedules.reduce((acc, schedule) => {
  if (!schedule.booking_assignment_id) return acc
  if (!acc[schedule.booking_assignment_id]) {
    acc[schedule.booking_assignment_id] = []
  }
  acc[schedule.booking_assignment_id].push(schedule)
  return acc
}, {} as Record<string, typeof schedules>)
```

#### getVendorResources()

Fetches lists of all vehicles and drivers for a vendor.

**Returns:**
```typescript
{
  vehicles: Array<{
    id: string
    make: string
    model: string
    year: number
    registration_number: string
    seats: number | null
  }>
  drivers: Array<{
    id: string
    first_name: string
    last_name: string
    phone: string
    license_number: string
  }>
}
```

**Process:**
1. Authenticates user and fetches vendor application
2. Queries vehicles table filtered by vendor's business_id
3. Queries vendor_drivers table filtered by vendor_id
4. Returns both lists

#### markResourceUnavailable(resourceId, resourceType, startDate, endDate, reason, notes?)

Marks a resource as unavailable for a specified period.

**Parameters:**
```typescript
resourceId: string                    // UUID of vehicle or driver
resourceType: 'vehicle' | 'driver'    // Type of resource
startDate: string                     // ISO date string for start
endDate: string                       // ISO date string for end
reason: string                        // Reason: maintenance, leave, sick, training, other
notes?: string                        // Optional additional notes
```

**Returns:**
```typescript
{ success: boolean }
```

**Process:**
1. Authenticates user and fetches vendor application
2. Checks for conflicts using `AvailabilityService.checkAvailability()`
3. If conflicts exist, throws error
4. Creates unavailability record via `AvailabilityService.markUnavailable()`
5. Revalidates `/vendor/availability` path for fresh data
6. Returns success status

**Conflict Detection:**
```typescript
const hasConflicts = !(await AvailabilityService.checkAvailability(
  resourceId,
  resourceType,
  new Date(startDate),
  new Date(endDate),
  vendorApp.id
))

if (hasConflicts) {
  throw new Error('Resource has bookings during this period')
}
```

#### removeUnavailability(unavailabilityId)

Removes an existing unavailability period.

**Parameters:**
```typescript
unavailabilityId: string  // UUID of unavailability record
```

**Returns:**
```typescript
{ success: boolean }
```

**Process:**
1. Authenticates user and fetches vendor application
2. Deletes unavailability record (RLS ensures vendor owns it)
3. Revalidates `/vendor/availability` path
4. Returns success status

#### checkResourceAvailability(resourceId, resourceType, startDate, endDate)

Checks if a resource is available during a specific period and returns conflicts.

**Parameters:**
```typescript
resourceId: string
resourceType: 'vehicle' | 'driver'
startDate: string
endDate: string
```

**Returns:**
```typescript
{
  available: boolean
  conflicts: Array<ResourceSchedule | ResourceUnavailability>
}
```

**Process:**
1. Uses `AvailabilityService.checkAvailability()` for boolean check
2. Uses `AvailabilityService.getConflicts()` for detailed conflict list
3. Returns both results

### Availability Service (`lib/availability/service.ts`)

#### checkAvailability(resourceId, resourceType, startTime, endTime, vendorId?)

Checks if a resource is available for a given time period.

**Returns:** `Promise<boolean>` - true if available, false if conflicts exist

**Logic:**
```typescript
// Check for existing schedules (bookings)
const schedules = await supabase
  .from('resource_schedules')
  .select('*')
  .eq('resource_id', resourceId)
  .eq('resource_type', resourceType)
  .or(`and(start_datetime.lt.${endTime.toISOString()},end_datetime.gt.${startTime.toISOString()})`)

// Check for unavailability periods
const unavailability = await supabase
  .from('resource_unavailability')
  .select('*')
  .eq('resource_id', resourceId)
  .eq('resource_type', resourceType)
  .or(`and(start_datetime.lt.${endTime.toISOString()},end_datetime.gt.${startTime.toISOString()})`)

// Available if no conflicts found
return (!schedules || schedules.length === 0) && (!unavailability || unavailability.length === 0)
```

**Date Overlap Logic:**
An event overlaps with the period if:
- Event starts on/before the period ends (`start_datetime < endTime`)
- AND Event ends on/after the period starts (`end_datetime > startTime`)

#### getVendorSchedules(vendorId, startDate?, endDate?)

Retrieves all schedule entries (bookings) for a vendor's resources.

**Returns:** `Promise<ResourceSchedule[]>`

**Key Feature - Current and Future Only:**
```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)

if (startDate && endDate) {
  // Use the later of startDate or today
  const effectiveStartDate = startDate < today ? today : startDate
  query = query
    .lte('start_datetime', endDate.toISOString())
    .gte('end_datetime', effectiveStartDate.toISOString())
} else {
  // No date range specified, show only future
  query = query.gte('end_datetime', today.toISOString())
}
```

This ensures past bookings are hidden from the calendar view.

#### getVendorUnavailability(vendorId, startDate?, endDate?)

Retrieves unavailability periods for a vendor's resources.

**Returns:** `Promise<ResourceUnavailability[]>`

**Same filtering logic** as `getVendorSchedules()` - only shows current and future periods.

#### markUnavailable(resourceId, resourceType, vendorId, startTime, endTime, reason, notes?)

Creates an unavailability record.

**Returns:** `Promise<boolean>` - true if successful

**Process:**
1. Authenticates user
2. Inserts record into resource_unavailability table
3. Records created_by for audit trail
4. Returns success status

#### createSchedule(assignmentId, vendorId, vehicleId, driverId, startTime, endTime)

Creates schedule entries when a booking is accepted.

**Returns:** `Promise<boolean>` - true if successful

**Process:**
1. Creates TWO schedule records:
   - One for vehicle
   - One for driver
2. Both records have same booking_assignment_id
3. Both records have identical start/end times
4. Both records have status 'booked'

```typescript
const schedules = [
  {
    vendor_id: vendorId,
    resource_type: 'vehicle' as const,
    resource_id: vehicleId,
    booking_assignment_id: assignmentId,
    start_datetime: startTime.toISOString(),
    end_datetime: endTime.toISOString(),
    status: 'booked'
  },
  {
    vendor_id: vendorId,
    resource_type: 'driver' as const,
    resource_id: driverId,
    booking_assignment_id: assignmentId,
    start_datetime: startTime.toISOString(),
    end_datetime: endTime.toISOString(),
    status: 'booked'
  }
]
```

#### removeSchedule(assignmentId)

Removes schedule entries when a booking is cancelled or completed.

**Returns:** `Promise<boolean>` - true if successful

**Process:**
1. Deletes all resource_schedules records with matching booking_assignment_id
2. Removes both vehicle and driver schedules in one operation

#### getAvailableResources(vendorId, resourceType, startTime, endTime)

Gets list of available resources for a time period.

**Returns:** `Promise<string[]>` - Array of resource IDs

**Process:**
1. Fetches all resources of specified type
2. Filters by is_available flag
3. Checks availability for each resource
4. Returns array of available resource IDs

#### getConflicts(resourceId, resourceType, startTime, endTime)

Gets detailed list of conflicts for a resource in a time period.

**Returns:** `Promise<Array<ResourceSchedule | ResourceUnavailability>>`

**Process:**
1. Queries resource_schedules for overlapping bookings
2. Queries resource_unavailability for overlapping periods
3. Combines and returns both arrays

## UI Components

### AvailabilityCalendar Component

Main client component that renders the calendar interface.

**Location:** `app/vendor/availability/components/availability-calendar.tsx`

**Props:**
```typescript
interface AvailabilityCalendarProps {
  initialEvents: CalendarEvent[]
  vehicles: Vehicle[]
  drivers: Driver[]
}
```

### Key Features

#### Calendar Library Integration

Uses `react-big-calendar` with custom configuration:

```typescript
<Calendar
  localizer={momentLocalizer(moment)}
  events={filteredEvents}
  startAccessor="start"
  endAccessor="end"
  style={{ height: 600 }}
  view={view}
  date={date}
  onNavigate={handleNavigate}
  onView={setView}
  onSelectEvent={handleEventClick}
  eventPropGetter={eventStyleGetter}
  views={['month', 'week', 'day']}
/>
```

#### Event Styling

Custom styling function for event colors and appearance:

```typescript
const eventStyleGetter = (event: CalendarEvent) => {
  const style = {
    backgroundColor: event.color || '#3B82F6',
    borderRadius: '4px',
    opacity: 0.9,
    color: 'white',
    border: '0px',
    display: 'block'
  }
  return { style }
}
```

- Bookings: Blue (#3B82F6)
- Unavailability: Red (#EF4444)

#### Smart Navigation with Past Month Blocking

```typescript
const currentMonthStart = useMemo(() => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}, [])

const handleNavigate = useCallback((newDate: Date) => {
  const newMonthStart = new Date(newDate.getFullYear(), newDate.getMonth(), 1)

  if (newMonthStart < currentMonthStart) {
    toast.info('Past bookings are available in the Bookings History page', {
      description: 'Calendar shows only current and upcoming bookings'
    })
    return
  }

  setDate(newDate)
}, [currentMonthStart])
```

**Design Rationale:**
- Calendar focuses on current and future planning
- Past bookings don't need scheduling attention
- Historical data available in dedicated Bookings page
- Reduces clutter and cognitive load

#### Client-Side Filtering Logic

```typescript
const filteredEvents = useMemo(() => {
  let filtered = events

  // Filter by resource type
  if (filterType === 'vehicle') {
    filtered = filtered.filter(e => {
      return e.type === 'booking' || e.resourceType === 'vehicle'
    })
  } else if (filterType === 'driver') {
    filtered = filtered.filter(e => {
      return e.type === 'booking' || e.resourceType === 'driver'
    })
  }

  // Filter by specific resource
  if (selectedResourceFilter !== 'all') {
    filtered = filtered.filter(e => {
      if (e.type === 'booking') {
        // For bookings, check both vehicle and driver IDs
        const vehicleId = e.details?.vehicle?.id
        const driverId = e.details?.driver?.id
        return vehicleId === selectedResourceFilter || driverId === selectedResourceFilter
      } else {
        // For unavailability, check resource ID
        return e.resourceId === selectedResourceFilter
      }
    })
  }

  return filtered
}, [events, filterType, selectedResourceFilter])
```

**Key Logic:**
- Vehicle/Driver tabs show ALL bookings (since each booking has both)
- Vehicle/Driver tabs filter unavailability by type
- Specific resource filter checks both vehicle and driver IDs for bookings

#### Event Details Dialog

Clicking an event opens a dialog with comprehensive details:

**For Bookings:**
```tsx
{selectedEvent.type === 'booking' && (
  <>
    {/* Booking Information */}
    <div className="space-y-4">
      <div>
        <Label>Booking Number</Label>
        <p>{selectedEvent.details?.bookingNumber || 'N/A'}</p>
      </div>

      {/* Customer Details */}
      <div>
        <Label>Customer</Label>
        <p>{selectedEvent.details?.customer}</p>
        <p className="text-sm text-muted-foreground">{selectedEvent.details?.phone}</p>
      </div>

      {/* Route Information */}
      <div>
        <Label>Pickup</Label>
        <p>{selectedEvent.details?.pickup}</p>
      </div>
      <div>
        <Label>Dropoff</Label>
        <p>{selectedEvent.details?.dropoff}</p>
      </div>

      {/* Vehicle Details */}
      {selectedEvent.details?.vehicle && (
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-1">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Vehicle:</span>
          </div>
          <div className="text-sm ml-6">
            <div>{selectedEvent.details.vehicle.make} {selectedEvent.details.vehicle.model}</div>
            <div className="text-muted-foreground">Reg: {selectedEvent.details.vehicle.registrationNumber}</div>
          </div>
        </div>
      )}

      {/* Driver Details */}
      {selectedEvent.details?.driver && (
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Driver:</span>
          </div>
          <div className="text-sm ml-6">
            <div>{selectedEvent.details.driver.firstName} {selectedEvent.details.driver.lastName}</div>
            {selectedEvent.details.driver.phone && (
              <div className="text-muted-foreground">Phone: {selectedEvent.details.driver.phone}</div>
            )}
          </div>
        </div>
      )}
    </div>
  </>
)}
```

**For Unavailability:**
- Resource name and type
- Reason
- Date range
- Notes
- "Remove" button (calls removeUnavailability action)

### Filter Controls Component

Located within AvailabilityCalendar:

```tsx
<div className="flex gap-4 mb-4">
  {/* Resource Type Tabs */}
  <Tabs value={filterType} onValueChange={(val) => setFilterType(val as any)}>
    <TabsList>
      <TabsTrigger value="all">All Resources</TabsTrigger>
      <TabsTrigger value="vehicle">Vehicles</TabsTrigger>
      <TabsTrigger value="driver">Drivers</TabsTrigger>
    </TabsList>
  </Tabs>

  {/* Specific Resource Dropdown */}
  <Select value={selectedResourceFilter} onValueChange={setSelectedResourceFilter}>
    <SelectTrigger className="w-[250px]">
      <SelectValue placeholder="Filter by resource" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All {filterType === 'vehicle' ? 'Vehicles' : filterType === 'driver' ? 'Drivers' : 'Resources'}</SelectItem>
      {filterType === 'vehicle' || filterType === 'all' ? (
        vehicles.map(v => (
          <SelectItem key={v.id} value={v.id}>
            {v.make} {v.model} ({v.registration_number})
          </SelectItem>
        ))
      ) : null}
      {filterType === 'driver' || filterType === 'all' ? (
        drivers.map(d => (
          <SelectItem key={d.id} value={d.id}>
            {d.first_name} {d.last_name}
          </SelectItem>
        ))
      ) : null}
    </SelectContent>
  </Select>
</div>
```

### Mark Unavailable Button & Form

Separate dialog for creating unavailability periods:

```tsx
<Dialog open={showUnavailableForm} onOpenChange={setShowUnavailableForm}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Mark Resource Unavailable</DialogTitle>
    </DialogHeader>
    <Form onSubmit={handleMarkUnavailable}>
      <Select name="resourceType" required>
        <option value="">Select Type</option>
        <option value="vehicle">Vehicle</option>
        <option value="driver">Driver</option>
      </Select>

      <Select name="resourceId" required>
        {/* Dynamic list based on resourceType */}
      </Select>

      <Input type="datetime-local" name="startDate" required />
      <Input type="datetime-local" name="endDate" required />

      <Select name="reason" required>
        <option value="maintenance">Maintenance</option>
        <option value="leave">Leave</option>
        <option value="sick">Sick</option>
        <option value="training">Training</option>
        <option value="other">Other</option>
      </Select>

      <Textarea name="notes" placeholder="Additional notes..." />

      <Button type="submit">Mark Unavailable</Button>
    </Form>
  </DialogContent>
</Dialog>
```

## User Workflows

### Viewing Calendar and Bookings

**Workflow:**
1. Vendor navigates to `/vendor/availability`
2. Page loads with current month view
3. Calendar shows:
   - Blue badges for accepted bookings
   - Red badges for unavailability periods
4. Vendor can see at a glance which resources are busy

**Use Cases:**
- Daily planning: "What bookings do I have today?"
- Weekly overview: "How busy is next week?"
- Resource planning: "When can I schedule maintenance?"

### Filtering by Resources

**Workflow:**
1. Vendor wants to see specific resource's schedule
2. Clicks "Vehicles" or "Drivers" tab to filter by type
3. Opens resource dropdown and selects specific vehicle/driver
4. Calendar updates to show only relevant events

**Use Cases:**
- Vehicle maintenance planning: Filter by specific vehicle
- Driver schedule review: Filter by specific driver
- Resource availability checking: See when specific resource is free

### Creating Unavailability Periods

**Workflow:**
1. Vendor clicks "Mark Unavailable" button
2. Dialog opens with form
3. Vendor fills in:
   - Resource type (Vehicle or Driver)
   - Specific resource
   - Start date and time
   - End date and time
   - Reason (dropdown)
   - Optional notes
4. Clicks "Mark Unavailable"
5. System checks for conflicts
6. If no conflicts, creates unavailability period
7. Calendar refreshes showing new red badge
8. If conflicts exist, shows error message

**Use Cases:**
- Scheduled maintenance: Mark vehicle unavailable for service
- Driver vacation: Mark driver unavailable for leave period
- Training: Mark driver unavailable for training days
- Vehicle repairs: Mark vehicle unavailable during repair period

### Viewing Event Details

**Workflow:**
1. Vendor clicks on any calendar event
2. Dialog opens with detailed information
3. For bookings:
   - See customer name and contact
   - Review pickup/dropoff locations
   - Check assigned vehicle details
   - Check assigned driver details
   - View booking status
4. For unavailability:
   - See resource and reason
   - Review date range
   - Read notes
   - Option to remove if needed
5. Clicks "Close" or outside dialog to dismiss

**Use Cases:**
- Pre-trip preparation: Review booking details before service
- Customer contact: Get phone number to call customer
- Schedule verification: Confirm correct vehicle/driver assigned
- Unavailability management: Review and potentially remove periods

### Navigating Time Periods

**Workflow:**
1. Vendor uses navigation controls:
   - "Previous" button: Go to previous month/week/day
   - "Next" button: Go to next month/week/day
   - "Today" button: Jump to current date
   - View selector: Switch between Month/Week/Day
2. If trying to navigate to past month:
   - System blocks navigation
   - Shows toast message
   - Suggests using Bookings History page
3. Calendar updates showing requested time period

**Use Cases:**
- Future planning: Navigate ahead to see upcoming schedules
- Daily operations: Switch to day view for today
- Weekly planning: Use week view for detailed scheduling
- Return to today: Quick "Today" button to reset view

## Business Logic

### Date Overlap Detection Algorithm

The system determines if two time periods overlap using this logic:

**Overlap Condition:**
Two periods (A and B) overlap if:
- Period A starts on/before Period B ends
- AND Period A ends on/after Period B starts

**SQL Implementation:**
```sql
-- Check if event overlaps with [startTime, endTime] range
WHERE start_datetime <= endTime
  AND end_datetime >= startTime
```

**Why This Works:**

Example periods:
- Range: Jan 20 10:00 - Jan 20 12:00
- Event 1: Jan 20 09:00 - Jan 20 11:00 (overlaps - ends during range)
- Event 2: Jan 20 11:30 - Jan 20 13:00 (overlaps - starts during range)
- Event 3: Jan 20 10:30 - Jan 20 11:30 (overlaps - entirely within range)
- Event 4: Jan 20 08:00 - Jan 20 14:00 (overlaps - encompasses range)
- Event 5: Jan 20 08:00 - Jan 20 09:30 (no overlap - ends before range)
- Event 6: Jan 20 13:00 - Jan 20 15:00 (no overlap - starts after range)

**Previous Bug:**
Using `<` and `>` (strict inequalities) missed edge cases where events touched boundaries.

**Fixed Implementation:**
Using `<=` and `>=` (inclusive inequalities) correctly detects all overlaps including boundary touches.

### Current and Future Filtering Rules

**Rule:** Calendar only shows bookings and unavailability from today onwards.

**Implementation:**
```typescript
const today = new Date()
today.setHours(0, 0, 0, 0)  // Midnight today

if (startDate && endDate) {
  const effectiveStartDate = startDate < today ? today : startDate
  query = query
    .lte('start_datetime', endDate.toISOString())
    .gte('end_datetime', effectiveStartDate.toISOString())
} else {
  query = query.gte('end_datetime', today.toISOString())
}
```

**Key Logic:**
- Uses the LATER of: requested startDate OR today
- Shows events that END on/after the effective start
- This means a booking ending at 1 AM today still shows (hasn't fully passed)

**Rationale:**
1. **Focus on Actionable Items**: Past bookings need no scheduling decisions
2. **Reduce Visual Clutter**: Cleaner interface for vendors
3. **Performance**: Fewer records to fetch and render
4. **User Experience**: Vendors care about "what's next" not "what happened"
5. **Historical Data**: Available in dedicated Bookings History page

### Past Month Navigation Blocking Rationale

**Decision:** Block navigation to months before the current month.

**Why:**
1. **Data Consistency**: Calendar hides past bookings, so past months would be empty
2. **User Confusion**: Empty calendars create confusion ("Where are my bookings?")
3. **Clear Communication**: Toast message directs users to correct location
4. **Better UX**: Prevents frustration of navigating through empty views

**User Message:**
```
"Past bookings are available in the Bookings History page"
Description: "Calendar shows only current and upcoming bookings"
```

**Design Philosophy:**
- Different tools for different purposes
- Calendar = future planning
- History page = past records and analytics

### Event Grouping Logic (Combining Vehicle + Driver)

**Problem:** Original implementation showed two separate badges per booking.

**Solution:** Group schedules by booking_assignment_id and create single event.

**Implementation:**
```typescript
// Step 1: Group schedules by booking
const bookingGroups = schedules.reduce((acc, schedule) => {
  if (!schedule.booking_assignment_id) return acc
  if (!acc[schedule.booking_assignment_id]) {
    acc[schedule.booking_assignment_id] = []
  }
  acc[schedule.booking_assignment_id].push(schedule)
  return acc
}, {} as Record<string, typeof schedules>)

// Step 2: Create ONE event per booking
for (const [assignmentId, groupSchedules] of Object.entries(bookingGroups)) {
  const firstSchedule = groupSchedules[0]  // All have same timing

  // Fetch BOTH vehicle and driver details
  const { data: assignment } = await adminClient
    .from('booking_assignments')
    .select(`
      *,
      booking:bookings(...),
      vehicle:vehicles(id, make, model, registration_number),
      driver:vendor_drivers(id, first_name, last_name, phone)
    `)
    .eq('id', assignmentId)
    .single()

  // Create single event with BOTH resources
  events.push({
    id: assignmentId,
    title: `Booking #${assignment.booking.booking_number}`,
    start: new Date(firstSchedule.start_datetime),
    end: new Date(firstSchedule.end_datetime),
    resourceId: assignmentId,
    resourceType: 'booking',  // Not 'vehicle' or 'driver'
    type: 'booking',
    color: '#3B82F6',
    details: {
      bookingNumber: assignment.booking.booking_number,
      customer: assignment.booking.customer.full_name,
      vehicle: { id, make, model, registrationNumber },
      driver: { id, firstName, lastName, phone }
    }
  })
}
```

**Benefits:**
1. **Cleaner UI**: One badge instead of two
2. **Better UX**: No duplicate information
3. **Complete Information**: Single popup shows both resources
4. **Easier Scanning**: Vendors can quickly count bookings

**Filtering Adaptation:**
Since resourceType is now 'booking', filtering logic checks details:
```typescript
if (e.type === 'booking') {
  const vehicleId = e.details?.vehicle?.id
  const driverId = e.details?.driver?.id
  return vehicleId === selectedResourceFilter || driverId === selectedResourceFilter
}
```

### Conflict Detection Rules

**Rule:** Cannot mark resource unavailable if bookings exist during that period.

**Implementation:**
```typescript
// Check availability (returns false if conflicts exist)
const isAvailable = await AvailabilityService.checkAvailability(
  resourceId,
  resourceType,
  new Date(startDate),
  new Date(endDate),
  vendorApp.id
)

if (!isAvailable) {
  throw new Error('Resource has bookings during this period')
}
```

**Conflict Types:**
1. **Booking Conflicts**: resource_schedules entries
2. **Unavailability Conflicts**: Overlapping resource_unavailability periods

**Why Enforce:**
- Prevents disruption to accepted bookings
- Maintains data integrity
- Protects customer commitments
- Forces vendor to reschedule or cancel booking first

**User Flow:**
1. Vendor tries to mark unavailable
2. System detects conflict
3. Error message shown
4. Vendor must:
   - Choose different dates, OR
   - Cancel/reassign the booking first

### Unavailability Reasons

**Available Reasons:**
- **Maintenance**: Scheduled vehicle service, repairs
- **Leave**: Driver vacation, time off
- **Sick**: Driver illness, unexpected absence
- **Training**: Driver training, certification courses
- **Other**: Any other reason not listed

**Purpose:**
- **Categorization**: Better reporting and analytics
- **Planning**: Understand patterns (e.g., frequent maintenance)
- **Communication**: Clear reason visible in calendar
- **Auditing**: Track why resources were unavailable

**Usage in UI:**
Dropdown with predefined options ensures consistency and enables filtering/reporting.

## Data Flow

### How Bookings Appear on Calendar

```
1. Admin assigns booking to vendor
   ↓
2. Vendor accepts and assigns driver + vehicle
   ↓
3. acceptAndAssignResources() action called
   ↓
4. Updates booking_assignments table
   ├─ driver_id: selected driver
   ├─ vehicle_id: selected vehicle
   ├─ status: 'accepted'
   └─ accepted_at: current timestamp
   ↓
5. AvailabilityService.createSchedule() called
   ↓
6. Inserts TWO records in resource_schedules
   ├─ Vehicle schedule (resource_type: 'vehicle')
   └─ Driver schedule (resource_type: 'driver')
   ↓
7. Revalidates /vendor/availability path
   ↓
8. Page refetches on next load/visit
   ↓
9. getVendorCalendarEvents() groups schedules
   ↓
10. Creates single calendar event
    ├─ Blue badge on calendar
    └─ Contains both vehicle and driver info
```

### Schedule Creation on Booking Acceptance

**Trigger:** Vendor accepts booking and assigns resources

**Process:**
```typescript
// In acceptAndAssignResources action
const pickupTime = new Date(assignment.booking.pickup_datetime)
const estimatedEndTime = new Date(pickupTime.getTime() + 2 * 60 * 60 * 1000)  // +2 hours

await AvailabilityService.createSchedule(
  assignmentId,
  vendorApp.id,
  vehicleId,
  driverId,
  pickupTime,
  estimatedEndTime
)
```

**Creates:**
```sql
-- Vehicle schedule
INSERT INTO resource_schedules (
  vendor_id, resource_type, resource_id, booking_assignment_id,
  start_datetime, end_datetime, status
) VALUES (
  'vendor-uuid', 'vehicle', 'vehicle-uuid', 'assignment-uuid',
  '2025-01-20 10:00:00', '2025-01-20 12:00:00', 'booked'
);

-- Driver schedule
INSERT INTO resource_schedules (
  vendor_id, resource_type, resource_id, booking_assignment_id,
  start_datetime, end_datetime, status
) VALUES (
  'vendor-uuid', 'driver', 'driver-uuid', 'assignment-uuid',
  '2025-01-20 10:00:00', '2025-01-20 12:00:00', 'booked'
);
```

**Duration Estimation:**
Currently uses fixed 2-hour estimate. Could be enhanced to:
- Calculate based on route distance
- Use historical data for similar routes
- Allow manual adjustment by vendor

### Schedule Removal on Booking Completion

**Trigger:** Vendor marks booking as completed OR booking is cancelled

**Process:**
```typescript
// In completeBooking action
await AvailabilityService.removeSchedule(assignmentId)
```

**Removes:**
```sql
DELETE FROM resource_schedules
WHERE booking_assignment_id = 'assignment-uuid';
```

**Effect:**
- Removes both vehicle and driver schedules (matched by assignment ID)
- Frees up resources for new bookings
- Historical record preserved in booking_assignments table
- Calendar no longer shows the booking (past date + no schedule)

### Unavailability Period Management

**Creation Flow:**
```
1. Vendor clicks "Mark Unavailable"
   ↓
2. Fills form (resource, dates, reason, notes)
   ↓
3. Submits form
   ↓
4. markResourceUnavailable() action called
   ↓
5. Checks for conflicts via AvailabilityService.checkAvailability()
   ↓
6. If no conflicts:
   ├─ Inserts record in resource_unavailability
   ├─ Revalidates path
   └─ Shows success message
   ↓
7. If conflicts:
   └─ Shows error with conflict details
   ↓
8. Calendar refreshes
   ↓
9. Red badge appears on calendar
```

**Removal Flow:**
```
1. Vendor clicks on unavailability event
   ↓
2. Event details dialog opens
   ↓
3. Vendor clicks "Remove" button
   ↓
4. Confirmation (optional)
   ↓
5. removeUnavailability() action called
   ↓
6. Deletes record from resource_unavailability
   ↓
7. Revalidates path
   ↓
8. Calendar refreshes
   ↓
9. Red badge disappears
```

## Recent Improvements

### 1. Fixed Date Filtering Logic (Overlap Detection)

**Problem:**
Old bookings weren't showing in calendar. September booking ending at 6:30 AM didn't show when viewing October.

**Root Cause:**
Incorrect date comparison operators (`<` and `>`) that excluded boundary overlaps.

**Previous Logic:**
```typescript
.lt('start_datetime', endDate)    // strictly less than
.gt('end_datetime', startDate)    // strictly greater than
```

**Fixed Logic:**
```typescript
.lte('start_datetime', endDate)   // less than or equal
.gte('end_datetime', startDate)   // greater than or equal
```

**Why It Matters:**
- Includes events that touch range boundaries
- Properly detects all types of overlaps
- Mathematically correct overlap detection

**Files Modified:**
- `lib/availability/service.ts` (lines 111-130, 162-180)

### 2. Implemented Past Month Navigation Blocking

**Problem:**
Calendar allowed navigation to past months, which showed empty screens because past bookings are hidden.

**User Feedback:**
"If you hidden the past scheduling history so why you used past month calendar."

**Solution:**
Block navigation to months before current month with informative message.

**Implementation:**
```typescript
const currentMonthStart = useMemo(() => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}, [])

const handleNavigate = useCallback((newDate: Date) => {
  const newMonthStart = new Date(newDate.getFullYear(), newDate.getMonth(), 1)

  if (newMonthStart < currentMonthStart) {
    toast.info('Past bookings are available in the Bookings History page', {
      description: 'Calendar shows only current and upcoming bookings'
    })
    return  // Block navigation
  }

  setDate(newDate)
}, [currentMonthStart])
```

**Benefits:**
- Prevents confusing empty calendar views
- Educates user about where to find past data
- Better separation of concerns (calendar vs. history)

**Files Modified:**
- `app/vendor/availability/components/availability-calendar.tsx` (lines 165-176)

### 3. Combined Duplicate Events into Single Booking Badges

**Problem:**
Two badges showing per booking - one hovering showed vehicle, other showed driver. Both clicked to same popup data.

**User Feedback:**
"There is two Badge showing in booking calander one hoave showing vehcile second hover showing driver. But click on that showing same popup data"

**Root Cause:**
System creates separate resource_schedules for vehicle and driver, resulting in two calendar events.

**Solution:**
Group schedules by booking_assignment_id and create single combined event.

**Implementation Changes:**

**Step 1 - Grouping:**
```typescript
const bookingGroups = schedules.reduce((acc, schedule) => {
  if (!schedule.booking_assignment_id) return acc
  if (!acc[schedule.booking_assignment_id]) {
    acc[schedule.booking_assignment_id] = []
  }
  acc[schedule.booking_assignment_id].push(schedule)
  return acc
}, {} as Record<string, typeof schedules>)
```

**Step 2 - Fetch Combined Data:**
```typescript
const { data: assignment } = await adminClient
  .from('booking_assignments')
  .select(`
    *,
    booking:bookings(...),
    vehicle:vehicles(id, make, model, registration_number),
    driver:vendor_drivers(id, first_name, last_name, phone)
  `)
  .eq('id', assignmentId)
  .single()
```

**Step 3 - Single Event:**
```typescript
events.push({
  id: assignmentId,
  title: `Booking #${assignment.booking.booking_number}`,
  resourceType: 'booking',  // Changed from 'vehicle'/'driver'
  type: 'booking',
  details: {
    vehicle: { id, make, model, registrationNumber },
    driver: { id, firstName, lastName, phone }
  }
})
```

**Benefits:**
- Cleaner calendar UI
- No duplicate badges
- Complete information in single popup
- Better user experience

**Files Modified:**
- `app/vendor/availability/actions.ts` (lines 53-137)

### 4. Fixed Filtering with Combined Events

**Problem:**
After combining vehicle and driver into single event, filtering by Vehicles/Drivers tabs stopped working.

**User Feedback:**
"But these changes not showing booking in vehciles tab selection aur drivers tab selection in availability calendar"

**Root Cause:**
Filtering logic checked `resourceType` which changed from 'vehicle'/'driver' to 'booking'.

**Solution:**
Update filtering logic to check event details for vehicle/driver IDs.

**Implementation:**

**Added IDs to Event Details:**
```typescript
// In actions.ts
vehicle: assignment.vehicle ? {
  id: assignment.vehicle.id,  // Added for filtering
  make: assignment.vehicle.make,
  model: assignment.vehicle.model,
  registrationNumber: assignment.vehicle.registration_number
} : null,
driver: assignment.driver ? {
  id: assignment.driver.id,  // Added for filtering
  firstName: assignment.driver.first_name,
  lastName: assignment.driver.last_name,
  phone: assignment.driver.phone
} : null
```

**Updated Filtering Logic:**
```typescript
// Filter by resource type
if (filterType === 'vehicle') {
  filtered = filtered.filter(e => {
    return e.type === 'booking' || e.resourceType === 'vehicle'
  })
} else if (filterType === 'driver') {
  filtered = filtered.filter(e => {
    return e.type === 'booking' || e.resourceType === 'driver'
  })
}

// Filter by specific resource
if (selectedResourceFilter !== 'all') {
  filtered = filtered.filter(e => {
    if (e.type === 'booking') {
      const vehicleId = e.details?.vehicle?.id
      const driverId = e.details?.driver?.id
      return vehicleId === selectedResourceFilter || driverId === selectedResourceFilter
    } else {
      return e.resourceId === selectedResourceFilter
    }
  })
}
```

**Key Logic:**
- Bookings always show in vehicle/driver tabs (contain both)
- Unavailability filtered by type
- Specific resource filter checks details for bookings

**Files Modified:**
- `app/vendor/availability/actions.ts` (lines 123-134)
- `app/vendor/availability/components/availability-calendar.tsx` (lines 78-111)

## Integration Points

### Booking Assignment System

**Integration:** Calendar displays bookings after acceptance and resource assignment.

**Flow:**
1. Admin creates booking assignment
2. Vendor views in `/vendor/bookings`
3. Vendor accepts and assigns vehicle + driver
4. System calls `AvailabilityService.createSchedule()`
5. Calendar displays booking

**Key Tables:**
- `booking_assignments` - Assignment details
- `resource_schedules` - Schedule entries created

**Related Documentation:** [Vendor Driver and Booking Assignment](./vendor-driver-booking-assignment.md)

### Resource Scheduling

**Integration:** Core scheduling logic for managing resource allocation.

**Components:**
- `AvailabilityService` - Business logic layer
- `resource_schedules` table - Active bookings
- `resource_unavailability` table - Unavailable periods

**Functions:**
- `createSchedule()` - Creates schedules on booking acceptance
- `removeSchedule()` - Cleans up on completion/cancellation
- `checkAvailability()` - Prevents conflicts
- `getConflicts()` - Detailed conflict information

### Vehicle Management

**Integration:** Calendar displays and filters vehicle schedules.

**Connection:**
- Vehicle IDs in resource_schedules
- Vehicle details in event popups
- Vehicle dropdown for filtering
- Vehicle unavailability (maintenance, repairs)

**Related Tables:**
- `vehicles` - Vehicle information
- `resource_schedules` - Vehicle bookings
- `resource_unavailability` - Vehicle unavailability

**Related Documentation:** [Vehicle Module](./vehicle-module.md)

### Driver Management

**Integration:** Calendar displays and filters driver schedules.

**Connection:**
- Driver IDs in resource_schedules
- Driver details in event popups
- Driver dropdown for filtering
- Driver unavailability (leave, sick, training)

**Related Tables:**
- `vendor_drivers` - Driver information
- `resource_schedules` - Driver bookings
- `resource_unavailability` - Driver unavailability

**Related Documentation:** [Vendor Driver Creation](./vendor-driver-booking-assignment.md)

## Best Practices

### When to Mark Resources Unavailable

**Proactive Planning:**
- Mark maintenance windows in advance
- Schedule driver leave ahead of time
- Block training days early
- Plan for predictable unavailability

**Reactive Situations:**
- Vehicle breakdown → immediate unavailability
- Driver illness → mark unavailable for duration
- Emergency repairs → block affected time
- Weather issues → mark resources unavailable

**Best Practice:**
Add detailed notes explaining unavailability for future reference.

### How to Resolve Conflicts

**Scenario:** Trying to mark unavailable but booking exists.

**Resolution Options:**

1. **Choose Different Dates**
   - Find alternate time slot
   - Schedule around existing bookings

2. **Reassign Booking**
   - Assign different vehicle/driver to booking
   - Then mark original resource unavailable

3. **Cancel Booking**
   - If necessary, cancel the booking
   - Communicate with customer
   - Then mark resource unavailable

4. **Split Unavailability**
   - Mark unavailable before booking
   - Mark unavailable after booking
   - Leave booking time available

**Workflow:**
```
Conflict Detected
  ↓
Review booking details
  ↓
Decision:
├─ Reschedule unavailability → Choose new dates
├─ Reassign booking → Change resources
├─ Cancel booking → Contact customer
└─ Split period → Create two unavailability records
```

### Calendar Navigation Tips

**Efficient Navigation:**
- Use "Today" button to quickly return to current date
- Switch to Day view for immediate planning
- Use Week view for operational scheduling
- Use Month view for strategic planning

**View Selection Guide:**
- **Month**: Long-term planning, resource allocation
- **Week**: Day-to-day operations, immediate scheduling
- **Day**: Detailed time management, hourly precision

**Filtering Strategy:**
- Use "All Resources" for complete overview
- Filter by type (Vehicle/Driver) for specific planning
- Select individual resource to check specific availability
- Clear filters regularly to maintain big picture

### Performance Considerations

**Large Resource Lists:**
- System handles pagination server-side
- Client-side filtering is efficient with useMemo
- Consider search functionality if >50 resources

**Many Events:**
- Date range filtering reduces data load
- Only fetches viewed time period
- Month view loads ~30 days of data
- Week view loads 7 days
- Day view loads single day

**Optimization Tips:**
- Avoid switching views too frequently
- Use specific resource filters to reduce rendered events
- Navigate in larger jumps (months) rather than days
- Cache is invalidated on updates (revalidatePath)

## Code Examples

### Fetching Calendar Events

```typescript
import { getVendorCalendarEvents } from '@/app/vendor/availability/actions'

// Fetch events for current month
const now = new Date()
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

const events = await getVendorCalendarEvents(
  startOfMonth.toISOString(),
  endOfMonth.toISOString()
)

console.log('Calendar events:', events)
// Returns array of CalendarEvent objects
```

### Creating Unavailability Period

```typescript
import { markResourceUnavailable } from '@/app/vendor/availability/actions'

// Mark vehicle unavailable for maintenance
try {
  const result = await markResourceUnavailable(
    'vehicle-uuid-123',           // resourceId
    'vehicle',                     // resourceType
    '2025-01-22T08:00:00Z',       // startDate
    '2025-01-22T17:00:00Z',       // endDate
    'maintenance',                 // reason
    'Scheduled oil change and tire rotation'  // notes
  )

  if (result.success) {
    console.log('Resource marked unavailable')
  }
} catch (error) {
  console.error('Conflict detected:', error.message)
  // Handle conflict - show error to user
}
```

### Checking Resource Availability

```typescript
import { checkResourceAvailability } from '@/app/vendor/availability/actions'

// Check if driver is available for specific period
const availability = await checkResourceAvailability(
  'driver-uuid-456',
  'driver',
  '2025-01-25T10:00:00Z',
  '2025-01-25T14:00:00Z'
)

if (availability.available) {
  console.log('Driver is available')
} else {
  console.log('Driver has conflicts:', availability.conflicts)
  // Show conflict details to user
}
```

### Handling Event Clicks

```typescript
const handleEventClick = (event: CalendarEvent) => {
  if (event.type === 'booking') {
    // Show booking details
    console.log('Booking:', event.details.bookingNumber)
    console.log('Customer:', event.details.customer)
    console.log('Vehicle:', event.details.vehicle)
    console.log('Driver:', event.details.driver)
  } else if (event.type === 'unavailable') {
    // Show unavailability details
    console.log('Resource:', event.title)
    console.log('Reason:', event.details.reason)
    console.log('Notes:', event.details.notes)
  }

  // Open details dialog
  setSelectedEvent(event)
  setShowDetailsDialog(true)
}
```

### Filtering Events Client-Side

```typescript
import { useMemo } from 'react'

const filteredEvents = useMemo(() => {
  let filtered = events

  // Filter by resource type
  if (filterType === 'vehicle') {
    filtered = filtered.filter(e =>
      e.type === 'booking' || e.resourceType === 'vehicle'
    )
  } else if (filterType === 'driver') {
    filtered = filtered.filter(e =>
      e.type === 'booking' || e.resourceType === 'driver'
    )
  }

  // Filter by specific resource
  if (selectedResourceFilter !== 'all') {
    filtered = filtered.filter(e => {
      if (e.type === 'booking') {
        return (
          e.details?.vehicle?.id === selectedResourceFilter ||
          e.details?.driver?.id === selectedResourceFilter
        )
      } else {
        return e.resourceId === selectedResourceFilter
      }
    })
  }

  return filtered
}, [events, filterType, selectedResourceFilter])
```

### Removing Unavailability

```typescript
import { removeUnavailability } from '@/app/vendor/availability/actions'

// Remove an unavailability period
const handleRemoveUnavailability = async (unavailabilityId: string) => {
  try {
    const result = await removeUnavailability(unavailabilityId)

    if (result.success) {
      console.log('Unavailability removed')
      // Close dialog
      setShowDetailsDialog(false)
      // Calendar will refresh automatically
    }
  } catch (error) {
    console.error('Failed to remove:', error.message)
  }
}
```

## Troubleshooting Guide

### Issue: Events Not Showing on Calendar

**Symptoms:**
- Calendar appears empty
- Bookings exist but don't display
- Only some events show

**Possible Causes & Solutions:**

1. **Date Range Issue**
   - **Cause:** Events outside viewed date range
   - **Solution:** Navigate to correct time period
   - **Check:** Event start/end dates vs. calendar view dates

2. **Past Bookings**
   - **Cause:** Booking is in the past (hidden by design)
   - **Solution:** Check Bookings History page for past records
   - **Note:** Calendar only shows current and future

3. **Filter Applied**
   - **Cause:** Resource filter hiding events
   - **Solution:** Check filter settings, select "All Resources"
   - **Check:** Both type filter and specific resource dropdown

4. **No Accepted Bookings**
   - **Cause:** Bookings still in "pending" status
   - **Solution:** Accept bookings and assign resources first
   - **Check:** Booking status in vendor bookings page

5. **RLS Policy Issue**
   - **Cause:** Vendor application not properly associated
   - **Solution:** Verify vendor application status
   - **Check:** Database record in vendor_applications table

### Issue: Filtering Not Working

**Symptoms:**
- Changing filters has no effect
- Events don't update when selecting resource
- All events always show

**Possible Causes & Solutions:**

1. **Cache Issue**
   - **Cause:** Stale client-side data
   - **Solution:** Refresh page (Ctrl+R / Cmd+R)
   - **Check:** Open browser dev tools, check console for errors

2. **Missing IDs in Details**
   - **Cause:** Event details missing vehicle/driver IDs
   - **Solution:** Check getVendorCalendarEvents() includes IDs
   - **Check:** Console.log event.details to verify structure

3. **Filter State Not Updating**
   - **Cause:** React state issue
   - **Solution:** Check useState and useMemo dependencies
   - **Debug:** Add console.log in filtering logic

4. **Wrong Resource Type**
   - **Cause:** Selecting vehicle when viewing driver tab
   - **Solution:** Match resource type to selected tab
   - **Check:** Dropdown should update based on tab

### Issue: Cannot Create Unavailability

**Symptoms:**
- "Resource has bookings during this period" error
- Unavailability form submission fails
- Conflict detected message

**Possible Causes & Solutions:**

1. **Existing Booking Conflict**
   - **Cause:** Resource already booked during period
   - **Solution:** Choose different dates or reassign booking
   - **Check:** View calendar for overlapping bookings

2. **Overlapping Unavailability**
   - **Cause:** Another unavailability period exists
   - **Solution:** Remove or adjust existing unavailability
   - **Check:** Look for red badges in time period

3. **Date Range Invalid**
   - **Cause:** End date before start date
   - **Solution:** Verify date order
   - **Check:** Start datetime < End datetime

4. **Permission Issue**
   - **Cause:** User not authenticated or not vendor
   - **Solution:** Verify login and vendor status
   - **Check:** User role and vendor application approval

### Issue: Past Bookings Not Visible

**Symptoms:**
- Historical bookings missing
- Can't see completed bookings
- Calendar empty for past months

**This is By Design:**

**Why:**
- Calendar focuses on current and future planning
- Past bookings need no scheduling decisions
- Historical data in Bookings History page

**To View Past Bookings:**
1. Navigate to `/vendor/bookings`
2. Use status filters
3. View completed bookings
4. Access full historical data

**Alternative:**
- Remove "today" constraint from queries if needed
- Modify service layer to include past dates
- Not recommended for production

### Issue: Duplicate Events Appearing

**Symptoms:**
- Two badges for same booking
- Events overlap on calendar
- Same booking appears twice

**Solution:**
This should be fixed in latest version. If still occurring:

1. **Check Implementation**
   - Verify grouping logic in getVendorCalendarEvents()
   - Ensure bookingGroups reduces schedules correctly
   - Check that only one event created per booking_assignment_id

2. **Verify Data**
   - Query resource_schedules table directly
   - Check for duplicate booking_assignment_id entries
   - Ensure vehicle and driver schedules have same ID

3. **Update Code**
   - Pull latest version with combined events fix
   - Clear browser cache
   - Rebuild application

### Issue: Performance Slow with Many Events

**Symptoms:**
- Calendar takes long to load
- Switching views is laggy
- Filtering is slow

**Solutions:**

1. **Reduce Date Range**
   - Use Day or Week view instead of Month
   - Fetches less data
   - Renders fewer events

2. **Apply Filters**
   - Select specific resource
   - Filter by type (Vehicle/Driver)
   - Reduces rendered events

3. **Database Optimization**
   - Ensure indexes on resource_schedules
   - Index on (vendor_id, start_datetime, end_datetime)
   - Index on booking_assignment_id

4. **Code Optimization**
   - Verify useMemo dependencies
   - Check for unnecessary re-renders
   - Profile with React DevTools

### Debug Checklist

When troubleshooting, check:

- [ ] User authenticated and vendor application approved
- [ ] Correct date range selected
- [ ] No filters hiding events
- [ ] Bookings accepted and resources assigned
- [ ] Browser console for errors
- [ ] Network tab for failed requests
- [ ] Database records exist (resource_schedules, resource_unavailability)
- [ ] RLS policies allow access
- [ ] Server actions return data
- [ ] React component receiving props correctly

## Conclusion

The Vendor Availability Calendar provides a comprehensive solution for resource scheduling and management. With intelligent filtering, conflict prevention, and a focus on current and future planning, it enables vendors to efficiently manage their vehicles and drivers while maintaining high service quality.

The recent improvements addressing date filtering, navigation blocking, event consolidation, and filter functionality have significantly enhanced the user experience, making the calendar an essential tool for vendor operations.
