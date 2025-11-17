# Zone Module Documentation

## Overview

The Zone module is a core component of the Vehicle Service platform that enables location-based pricing and fare calculation. It allows administrators to organize geographical locations into pricing zones and define transfer costs between different zones, creating a flexible and scalable pricing matrix for transportation services.

## Key Features

- **Zone Management**: Create, update, and delete pricing zones
- **Location Assignment**: Assign locations (airports, cities, etc.) to specific zones
- **Pricing Matrix**: Define base prices for transfers between any two zones
- **Dynamic Pricing**: Support for zone-to-zone pricing calculations
- **Status Management**: Enable/disable zones and pricing rules
- **Sorting & Organization**: Control zone display order

## Architecture

### Database Schema

#### 1. **zones** Table
Stores the main zone information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | varchar | Zone display name (e.g., "Zone A", "Downtown") |
| slug | varchar | URL-friendly identifier |
| description | text | Optional zone description |
| sort_order | integer | Display order priority |
| is_active | boolean | Zone activation status |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

#### 2. **zone_pricing** Table
Defines pricing relationships between zones.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| from_zone_id | uuid | Source zone (FK to zones.id) |
| to_zone_id | uuid | Destination zone (FK to zones.id) |
| base_price | numeric | Base transfer price |
| currency | varchar | Currency code (default: USD) |
| is_active | boolean | Pricing rule status |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

#### 3. **locations** Table (Zone Integration)
Locations are linked to zones via the zone_id field.

| Column | Type | Description |
|--------|------|-------------|
| zone_id | uuid | Foreign key to zones.id (nullable) |
| ... | ... | Other location fields |

### Relationships

```
zones (1) ←→ (N) locations
zones (N) ←→ (N) zones (via zone_pricing)
```

## API Endpoints & Server Actions

### Zone Management Actions

#### `getZones()`
Retrieves all zones with location counts.
- **Returns**: Array of Zone objects with location_count
- **Usage**: Zone listing page

#### `getZone(id: string)`
Fetches a single zone by ID.
- **Parameters**: Zone UUID
- **Returns**: Zone object or null
- **Usage**: Zone edit/detail pages

#### `createZone(formData: FormData)`
Creates a new zone.
- **Parameters**: 
  - name: Zone name
  - slug: URL-friendly identifier
  - description: Optional description
  - sort_order: Display order
  - is_active: Activation status
- **Returns**: Success/error status

#### `updateZone(id: string, formData: FormData)`
Updates an existing zone.
- **Parameters**: Zone ID and updated fields
- **Returns**: Success/error status
- **Validations**: Checks for existing relationships

#### `deleteZone(id: string)`
Deletes a zone if no dependencies exist.
- **Parameters**: Zone UUID
- **Validations**: 
  - No assigned locations
  - No pricing rules
- **Returns**: Success/error status

### Pricing Management Actions

#### `getZonePricing()`
Retrieves all zone pricing rules with zone details.
- **Returns**: Array of ZonePricing objects
- **Usage**: Pricing matrix display

#### `updateZonePricing(fromZoneId, toZoneId, price)`
Creates or updates pricing between zones.
- **Parameters**:
  - fromZoneId: Source zone UUID
  - toZoneId: Destination zone UUID
  - price: Base price (numeric)
- **Validations**:
  - Verifies both zones exist
  - Handles same-zone pricing
  - Skips creation for zero prices
- **Returns**: Success/error status

#### `toggleZoneStatus(id: string, is_active: boolean)`
Toggles zone active status.
- **Parameters**: Zone ID and new status
- **Returns**: Success/error status

### Location Assignment Actions

#### `getLocationsWithZones()`
Retrieves all locations with their zone assignments.
- **Returns**: Locations with zone details
- **Usage**: Location assignment interface

#### `assignLocationsToZone(zoneId, locationIds)`
Assigns multiple locations to a zone.
- **Parameters**:
  - zoneId: Target zone UUID
  - locationIds: Array of location UUIDs
- **Returns**: Success/error status

## UI Components

### 1. **ZonesTable** (`components/zones-table.tsx`)
- Displays all zones in a data table
- Features:
  - Zone name, description, status
  - Location count badge
  - Quick actions (edit, delete, toggle status)
  - Sorting by order/name

### 2. **ZoneForm** (`components/zone-form.tsx`)
- Form for creating/editing zones
- Fields:
  - Name (required)
  - Slug (auto-generated or custom)
  - Description (optional)
  - Sort order
  - Active status toggle
- Validation and error handling

### 3. **PricingMatrix** (`components/pricing-matrix.tsx`)
- Interactive grid for zone-to-zone pricing
- Features:
  - Matrix view of all zone combinations
  - Inline price editing
  - Visual indicators for set prices
  - Real-time updates
  - Bidirectional pricing support

### 4. **LocationAssignment** (`components/location-assignment.tsx`)
- Interface for assigning locations to zones
- Features:
  - Available locations list
  - Assigned locations list
  - Bulk assignment/removal
  - Search and filter
  - Visual zone indicators

## User Workflows

### 1. Creating a New Zone
1. Navigate to Admin → Zones
2. Click "Add Zone" button
3. Fill in zone details:
   - Enter zone name (e.g., "Zone A", "Airport Zone")
   - Slug is auto-generated or can be customized
   - Add optional description
   - Set sort order for display
   - Toggle active status
4. Submit form
5. Zone is created and appears in the zones list

### 2. Setting Up Zone Pricing
1. Navigate to Admin → Zones → Pricing Matrix
2. View the grid showing all zone combinations
3. Click on any cell to set/edit price
4. Enter base price for that route
5. Price is automatically saved
6. Repeat for all required zone combinations

### 3. Assigning Locations to Zones
1. Navigate to Admin → Zones
2. Click on a zone's "Manage Locations" action
3. View available and assigned locations
4. Select locations to assign
5. Click "Assign to Zone"
6. Locations are now associated with the zone

### 4. Managing Zone Status
1. From the zones list, use the status toggle
2. Inactive zones remain in the system but aren't used for pricing
3. Reactivate zones as needed

## Business Logic

### Pricing Calculation
- Base price is determined by from_zone → to_zone lookup
- If no direct pricing exists, system can fall back to default logic
- Same-zone transfers can have special pricing
- Prices are stored in base currency (USD by default)

### Zone Assignment Rules
- Each location can belong to only one zone
- Locations without zones won't participate in zone-based pricing
- Changing a location's zone updates all related pricing calculations

### Deletion Constraints
- Zones cannot be deleted if they have:
  - Assigned locations
  - Active pricing rules
- Must first reassign/remove dependencies

## Integration Points

### 1. Booking System
- Uses zone pricing for fare calculation
- Retrieves zone information for pickup/dropoff locations
- Applies zone-based pricing rules

### 2. Location Management
- Locations reference zones via zone_id
- Zone assignment affects location-based pricing
- Zone changes cascade to location pricing

### 3. Search & Route Planning
- Zone information displayed in search results
- Pricing calculations based on zone matrix
- Route optimization considers zone boundaries

## Best Practices

### 1. Zone Organization
- Use clear, consistent naming (Zone A, B, C or geographical names)
- Set logical sort orders for display
- Keep zone descriptions informative

### 2. Pricing Strategy
- Set comprehensive pricing matrix
- Consider bidirectional pricing (A→B may differ from B→A)
- Regularly review and update prices
- Use zones to simplify complex pricing structures

### 3. Location Management
- Assign all active locations to zones
- Review assignments when adding new locations
- Consider geographical proximity when creating zones

### 4. Maintenance
- Regularly audit zone assignments
- Keep inactive zones for historical reference
- Document zone boundaries and rules

## Security Considerations

### Role-Based Access
- Only administrators can manage zones
- Zone modifications require admin authentication
- All actions are logged for audit

### Data Validation
- Foreign key constraints ensure referential integrity
- Price validations prevent negative values
- Slug uniqueness enforced at database level

### Performance
- Indexed foreign keys for fast lookups
- Cached pricing matrix for quick calculations
- Optimized queries with selective field loading

## Troubleshooting

### Common Issues

1. **Cannot delete zone**
   - Check for assigned locations
   - Verify no pricing rules exist
   - Remove dependencies first

2. **Pricing not appearing**
   - Ensure both zones are active
   - Check if price is greater than 0
   - Verify zones exist in database

3. **Location not showing in zone**
   - Confirm zone_id is properly set
   - Check location is active
   - Verify database sync

## Future Enhancements

### Planned Features
- Time-based pricing (peak/off-peak)
- Distance modifiers within zones
- Multi-currency support
- Zone boundary visualization on maps
- Bulk pricing import/export
- Historical pricing tracking
- Zone-based promotions

### API Extensions
- Public API for zone queries
- Webhook notifications for zone changes
- Batch operations for pricing updates

## Technical Notes

### Performance Optimization
- Pricing matrix uses Map for O(1) lookups
- Zones cached in memory where appropriate
- Database queries optimized with proper indexes

### Scalability
- Designed for hundreds of zones
- Efficient matrix storage (sparse matrix approach)
- Lazy loading for large datasets

### Testing Considerations
- Unit tests for pricing calculations
- Integration tests for zone assignments
- E2E tests for complete workflows

## Conclusion

The Zone module provides a flexible and powerful system for managing location-based pricing in the Vehicle Service platform. By organizing locations into zones and defining inter-zone pricing, administrators can efficiently manage complex pricing structures while maintaining simplicity in the user experience.