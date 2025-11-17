# Location Module Documentation

## Overview

The Location module provides comprehensive management of pickup and dropoff locations for the vehicle rental service. It includes features for creating, reading, updating, and deleting locations with advanced filtering and bulk operations.

## Features

- **CRUD Operations**: Full create, read, update, and delete functionality
- **Advanced Filtering**: Search and filter locations by multiple criteria
- **Bulk Operations**: Select and delete multiple locations at once
- **Google Maps Integration**: Address autocomplete and location preview
- **Type Safety**: Full TypeScript support with generated Supabase types
- **Server Actions**: Modern Next.js 13+ server actions for all operations

## Database Schema

### Table: `locations`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `name` | VARCHAR(255) | Display name of the location |
| `type` | ENUM | Location type: 'airport', 'city', 'hotel', 'station' |
| `address` | VARCHAR(500) | Full street address (optional) |
| `country_code` | VARCHAR(2) | ISO 3166-1 alpha-2 country code |
| `city` | VARCHAR(100) | City name (optional) |
| `latitude` | DECIMAL(10,8) | GPS latitude coordinate |
| `longitude` | DECIMAL(11,8) | GPS longitude coordinate |
| `timezone` | VARCHAR(50) | IANA timezone identifier |
| `allow_pickup` | BOOLEAN | Whether vehicles can be picked up |
| `allow_dropoff` | BOOLEAN | Whether vehicles can be dropped off |
| `is_active` | BOOLEAN | Whether location is available for bookings |
| `created_at` | TIMESTAMPTZ | Timestamp of creation |

### Indexes

- `idx_locations_type` - For type-based queries
- `idx_locations_city` - For city-based searches
- `idx_locations_country_code` - For country filtering
- `idx_locations_is_active` - For status filtering

### Row Level Security (RLS)

- Public users can view active locations only
- Admin users can manage all locations

## File Structure

```
app/admin/locations/
├── page.tsx                    # Main locations list page
├── new/
│   └── page.tsx               # Create new location page
├── [id]/
│   └── edit/
│       └── page.tsx           # Edit location page
├── actions.ts                 # Server actions for all operations
└── components/
    ├── location-list.tsx      # Basic location list (deprecated)
    ├── location-table-with-bulk.tsx  # Table with bulk selection
    ├── location-form.tsx      # Create/edit form component
    ├── location-filters.tsx   # Filter controls component
    ├── client-filters.tsx     # Client-side filter wrapper
    ├── bulk-actions-bar.tsx   # Bulk actions UI
    ├── address-autocomplete.tsx  # Google Maps autocomplete
    ├── google-maps-provider.tsx  # Maps context provider
    ├── google-maps-utils.ts   # Maps utility functions
    └── map-preview.tsx        # Location map preview

lib/types/location.ts          # TypeScript type definitions
```

## Key Components

### 1. Location List Page (`page.tsx`)

The main page that displays all locations with filtering and pagination.

**Features:**
- Server-side data fetching with filters
- URL-based state management
- Pagination controls
- Total locations count display

**Query Parameters:**
- `search` - Search by name, city, or address
- `type` - Filter by location type
- `status` - Filter by active/inactive
- `country` - Filter by country code
- `allowPickup` - Filter by pickup availability
- `allowDropoff` - Filter by dropoff availability
- `page` - Current page number

### 2. Location Table (`location-table-with-bulk.tsx`)

Interactive table component with checkbox selection for bulk operations.

**Features:**
- Select all/individual checkboxes
- Bulk actions bar (appears when items selected)
- Individual row actions (edit, delete)
- Type and status badges
- Service indicators (pickup/dropoff)

### 3. Location Form (`location-form.tsx`)

Comprehensive form for creating and editing locations.

**Tabs:**
1. **Location Information**
   - Basic details (name, type)
   - Address with Google Maps autocomplete
   - Automatic coordinate detection
   - Country and timezone detection

2. **Settings**
   - Service options (pickup/dropoff)
   - Active status toggle

**Features:**
- Real-time address autocomplete
- Map preview of selected location
- Form validation with Zod
- Loading states
- Error handling

### 4. Filter Components

**`location-filters.tsx`**
- Search input with debouncing
- Type dropdown (All, Airport, City, Hotel, Station)
- Status dropdown (All, Active, Inactive)
- Advanced filters popover:
  - Allow Pickup (All/Yes/No)
  - Allow Dropoff (All/Yes/No)
  - Country selection

**`client-filters.tsx`**
- Manages URL state synchronization
- Updates query parameters on filter change

### 5. Bulk Actions Bar (`bulk-actions-bar.tsx`)

Appears when locations are selected, providing bulk operations.

**Actions:**
- **Delete All** - Delete selected locations (with confirmation)
- **Activate All** - Activate selected locations (placeholder)
- **Deactivate All** - Deactivate selected locations (placeholder)
- **Export to CSV** - Export selected data (placeholder)

## Server Actions (`actions.ts`)

All database operations use Next.js server actions for type safety and performance.

### Available Actions:

```typescript
// Fetch locations with filters and pagination
getLocations(filters: LocationFilters): Promise<PaginatedLocations>

// Create a new location
createLocation(data: LocationFormData): Promise<Location>

// Update an existing location
updateLocation(id: string, data: Partial<LocationFormData>): Promise<Location>

// Delete a single location
deleteLocation(id: string): Promise<void>

// Delete multiple locations
bulkDeleteLocations(ids: string[]): Promise<{ success: boolean, count: number }>

// Get unique country codes
getCountries(): Promise<string[]>
```

## Type Definitions

### Core Types

```typescript
// Database row type
type Location = Database['public']['Tables']['locations']['Row']

// Location types enum
type LocationType = 'airport' | 'city' | 'hotel' | 'station'

// Status types
type LocationStatus = 'active' | 'inactive'
```

### Filter Interface

```typescript
interface LocationFilters {
  search?: string
  type?: LocationType | 'all'
  status?: LocationStatus | 'all'
  country?: string | 'all'
  allowPickup?: boolean | null
  allowDropoff?: boolean | null
  page?: number
  limit?: number
}
```

### Response Interface

```typescript
interface PaginatedLocations {
  locations: Location[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

## Usage Examples

### Creating a Location

```typescript
// Via form submission
const newLocation = await createLocation({
  name: "Dubai International Airport Terminal 1",
  type: "airport",
  address: "Dubai International Airport - Dubai - UAE",
  country_code: "AE",
  city: "Dubai",
  latitude: 25.2532,
  longitude: 55.3657,
  timezone: "Asia/Dubai",
  allow_pickup: true,
  allow_dropoff: true,
  is_active: true
})
```

### Fetching Locations with Filters

```typescript
// Get active airports in Dubai
const { locations, total } = await getLocations({
  type: 'airport',
  city: 'Dubai',
  status: 'active',
  page: 1,
  limit: 10
})
```

### Bulk Delete

```typescript
// Delete multiple locations
const result = await bulkDeleteLocations(['id1', 'id2', 'id3'])
console.log(`Deleted ${result.count} locations`)
```

## Security Considerations

1. **Authentication**: All operations check if user is authenticated
2. **Authorization**: Admin role required for all operations
3. **RLS Policies**: Database-level security for data access
4. **Input Validation**: Zod schema validation on forms
5. **Type Safety**: Full TypeScript coverage

## Performance Optimizations

1. **Server Actions**: No HTTP overhead, direct database queries
2. **Pagination**: Limits data transfer with configurable page size
3. **Indexed Columns**: Database indexes on frequently queried fields
4. **Revalidation**: Automatic cache invalidation with `revalidatePath`
5. **Debounced Search**: Prevents excessive queries while typing

## Google Maps Integration

The module integrates with Google Maps for enhanced location management:

1. **Address Autocomplete**: Type-ahead suggestions for addresses
2. **Coordinate Detection**: Automatic lat/lng from selected address
3. **Country Detection**: Extracts country code from address
4. **Timezone Detection**: Maps country to appropriate timezone
5. **Map Preview**: Visual confirmation of selected location

### Required Environment Variable

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Future Enhancements

1. **Bulk Status Update**: Activate/deactivate multiple locations
2. **Export Functionality**: CSV export of location data
3. **Import Locations**: Bulk import from CSV/Excel
4. **Location Groups**: Organize locations into groups
5. **Operating Hours**: Add business hours for each location
6. **Custom Fields**: Additional metadata per location type
7. **Distance Calculations**: Find nearest locations
8. **API Endpoints**: RESTful API for external integrations

## Troubleshooting

### Common Issues

1. **Google Maps not working**
   - Check if `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
   - Verify API key has Places API enabled

2. **Filters not persisting**
   - Ensure URL parameters are properly encoded
   - Check if page is using `force-dynamic` export

3. **Bulk delete not working**
   - Verify user has admin role
   - Check browser console for errors

4. **Form validation errors**
   - Country code must be exactly 2 characters
   - Name field is required
   - Type must be one of the valid options

## Related Documentation

- [Authentication and Roles](./authentication-and-roles.md)
- [Database Schema](./database-schema.md)
- [API Documentation](./api-documentation.md)