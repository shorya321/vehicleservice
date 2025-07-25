# Vehicle Module Documentation

## Overview

The Vehicle Module provides comprehensive vehicle fleet management capabilities for vendors in the VehicleService platform. It enables vendors to manage their rental vehicles, including adding, editing, deleting, and controlling availability.

## Database Schema

### vehicles Table

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL,  -- References vendor_applications.id
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(year FROM CURRENT_DATE) + 1),
  registration_number TEXT NOT NULL UNIQUE,
  daily_rate NUMERIC NOT NULL CHECK (daily_rate > 0),
  is_available BOOLEAN DEFAULT true,
  fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
  transmission TEXT CHECK (transmission IN ('manual', 'automatic')),
  seats INTEGER CHECK (seats > 0 AND seats <= 20),
  primary_image_url TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Key Relationships

- `business_id` links to `vendor_applications.id` (the approved vendor application)
- No direct foreign key constraint exists, but RLS policies enforce ownership

## Row Level Security (RLS) Policies

### Admin Policies
- **View All**: Admins can view all vehicles
- **Update All**: Admins can update all vehicles
- **Delete All**: Admins can delete all vehicles

### Vendor Policies
- **Insert Own**: Vendors can insert vehicles for their approved business
- **View Own**: Vendors can view their own vehicles
- **Update Own**: Vendors can update their own vehicles
- **Delete Own**: Vendors can delete their own vehicles

All vendor policies check:
1. User has an approved vendor application
2. Vehicle's business_id matches vendor's application ID

## Features

### 1. Vehicle Management

#### Add Vehicle
- Vendors can add new vehicles to their fleet
- Required fields: make, model, year, registration number, daily rate
- Optional fields: fuel type, transmission, seats, features

#### Edit Vehicle
- Update any vehicle information
- Maintains data integrity with validation
- Real-time form validation using Zod schema

#### Delete Vehicle
- Soft delete option available (via is_available flag)
- Hard delete with confirmation dialog
- Bulk delete for multiple vehicles

### 2. Advanced Search & Filtering

- **Search**: By make, model, or registration number
- **Status Filter**: Available/Unavailable
- **Fuel Type**: Petrol, Diesel, Electric, Hybrid
- **Transmission**: Manual, Automatic
- **Price Range**: Min/Max daily rate
- **Seats**: Filter by number of seats

### 3. Bulk Operations

- Select multiple vehicles
- Bulk mark as available/unavailable
- Bulk delete with confirmation
- Select all functionality

### 4. Pagination

- Server-side pagination
- 10 vehicles per page (configurable)
- URL-based state management
- Maintains filter state during navigation

## API Actions

### getVehicles(businessId, filters)
Fetches paginated vehicles with filtering support.

```typescript
interface VehicleFilters {
  search?: string
  status?: 'all' | 'available' | 'unavailable'
  fuelType?: 'all' | 'petrol' | 'diesel' | 'electric' | 'hybrid'
  transmission?: 'all' | 'manual' | 'automatic'
  minPrice?: number
  maxPrice?: number
  seats?: number
  page?: number
  limit?: number
}
```

### createVehicle(businessId, data)
Creates a new vehicle for the vendor.

### updateVehicle(vehicleId, businessId, data)
Updates existing vehicle information.

### deleteVehicle(vehicleId, businessId)
Permanently deletes a vehicle.

### toggleVehicleAvailability(vehicleId, businessId, isAvailable)
Toggles vehicle availability status.

### Bulk Operations
- `bulkDeleteVehicles(vehicleIds[], businessId)`
- `bulkToggleAvailability(vehicleIds[], businessId, isAvailable)`

## UI Components

### Page Structure
```
/vendor/vehicles
├── page.tsx              # Main vehicles list page
├── new/
│   └── page.tsx         # Add new vehicle
├── [id]/
│   └── edit/
│       └── page.tsx     # Edit existing vehicle
└── components/
    ├── vehicle-table.tsx           # Table view component
    ├── vehicle-table-with-bulk.tsx # Bulk actions wrapper
    ├── vehicle-filters.tsx         # Filter UI component
    ├── client-filters.tsx          # Client-side filter handler
    └── vehicle-form.tsx            # Add/Edit form component
```

### Component Hierarchy
```
VendorVehiclesPage
├── Stats Card (Total Vehicles)
├── Main Card
│   ├── ClientFilters
│   │   └── VehicleFiltersComponent
│   ├── VehicleTableWithBulk
│   │   ├── Bulk Actions Bar
│   │   └── VehicleTable
│   └── Pagination Controls
```

## Usage Examples

### Adding a Vehicle
1. Navigate to `/vendor/vehicles`
2. Click "Add Vehicle" button
3. Fill in required fields:
   - Make (e.g., Toyota)
   - Model (e.g., Camry)
   - Year (e.g., 2023)
   - Registration Number (e.g., ABC 123)
   - Daily Rate (e.g., 150 AED)
4. Set optional fields as needed
5. Toggle availability status
6. Click "Add Vehicle"

### Filtering Vehicles
1. Use search bar for quick text search
2. Select status, fuel type, or transmission from dropdowns
3. Click "Advanced" for price range and seats filters
4. Clear all filters with "Clear All" button

### Bulk Operations
1. Select vehicles using checkboxes
2. Use bulk action buttons:
   - Mark Available/Unavailable
   - Delete Selected
3. Confirm actions in dialog

## Best Practices

### Data Validation
- Registration numbers must be unique
- Year validation prevents future dates beyond next year
- Daily rate must be positive
- Seats limited to 1-20

### Performance
- Server-side pagination reduces data transfer
- Indexed columns for efficient filtering
- Optimistic UI updates with proper error handling

### Security
- RLS policies ensure data isolation
- Business ID validation on all operations
- Prepared statements prevent SQL injection

### User Experience
- Responsive design for all screen sizes
- Loading states during operations
- Toast notifications for feedback
- Confirmation dialogs for destructive actions

## Error Handling

Common errors and solutions:

1. **RLS Policy Violation**
   - Ensure vendor application is approved
   - Check business_id matches vendor's application

2. **Duplicate Registration**
   - Registration numbers must be unique across all vehicles
   - Show user-friendly error message

3. **Invalid Data**
   - Form validation prevents submission
   - Clear error messages for each field

## Future Enhancements

1. **Image Management**
   - Upload primary vehicle image
   - Gallery for multiple images
   - Integration with Supabase Storage

2. **Advanced Features**
   - Vehicle categories/classes
   - Maintenance tracking
   - Booking history per vehicle
   - Revenue analytics

3. **Import/Export**
   - Bulk import from CSV
   - Export vehicle list
   - Template downloads

4. **Mobile App Support**
   - API endpoints ready for mobile integration
   - Consistent data structure