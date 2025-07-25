# Vehicle Features Module

## Overview

The Vehicle Features module provides a comprehensive system for managing vehicle features and their associations with vehicles. It uses a normalized relational database structure with a junction table to enable flexible many-to-many relationships between vehicles and features, replacing the previous JSON-based approach for better data integrity and query performance.

## Purpose

- **Feature Standardization**: Ensure consistent feature definitions across all vehicles
- **Flexible Associations**: Many-to-many relationship between vehicles and features
- **Centralized Management**: Admin control over feature definitions and availability
- **Enhanced Search**: Enable customers to filter vehicles by specific features
- **Data Integrity**: Prevent feature inconsistencies and orphaned data
- **Performance Optimization**: Better query performance compared to JSON storage

## Database Architecture

### Core Tables

#### 1. `vehicle_features` Table (Master Feature Definitions)

```sql
CREATE TABLE vehicle_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    category TEXT NOT NULL CHECK (category IN ('safety', 'comfort', 'technology', 'entertainment', 'convenience', 'performance')),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Field Descriptions:**
- `id`: UUID primary key for unique identification
- `name`: Human-readable feature name (e.g., "Air Conditioning")
- `slug`: URL-friendly identifier (e.g., "air-conditioning")
- `icon`: Icon name for UI display (optional)
- `category`: Predefined category classification
- `description`: Optional detailed description
- `sort_order`: Controls display order within categories
- `is_active`: Whether feature is available for selection
- `created_at/updated_at`: Automatic timestamps

#### 2. `vehicle_feature_mappings` Table (Junction Table)

```sql
CREATE TABLE vehicle_feature_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES vehicle_features(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vehicle_id, feature_id)
);
```

**Field Descriptions:**
- `id`: UUID primary key
- `vehicle_id`: Foreign key to vehicles table
- `feature_id`: Foreign key to vehicle_features table
- `created_at`: When the feature was added to the vehicle
- **Unique Constraint**: Prevents duplicate feature assignments

### Feature Categories

The system supports 6 predefined categories with specific feature types:

#### 1. **Safety Features**
- Airbags (Driver, Passenger, Side, Curtain)
- Anti-lock Braking System (ABS)
- Electronic Stability Control (ESC)
- Backup Camera
- Parking Sensors
- Blind Spot Monitoring
- Lane Departure Warning

#### 2. **Comfort Features**
- Air Conditioning
- Climate Control
- Heated Seats
- Ventilated Seats
- Leather Seats
- Power Seats
- Lumbar Support

#### 3. **Technology Features**
- GPS Navigation System
- Bluetooth Connectivity
- WiFi Hotspot
- USB Ports
- Wireless Charging
- Keyless Entry
- Push Button Start

#### 4. **Entertainment Features**
- Apple CarPlay
- Android Auto
- Premium Sound System
- Satellite Radio
- DVD Player
- Rear Entertainment System
- Multiple Audio Sources

#### 5. **Convenience Features**
- Cruise Control
- Automatic Transmission
- Sunroof/Moonroof
- Power Windows
- Central Locking
- Auto-dimming Mirrors
- Rain-sensing Wipers

#### 6. **Performance Features**
- Turbo Engine
- Sport Mode
- All-Wheel Drive (AWD)
- Performance Tires
- Sport Suspension
- Manual Transmission
- Engine Start/Stop

### Migration from JSON to Relational Structure

#### Previous JSON Implementation
```sql
-- Old structure (deprecated)
ALTER TABLE vehicles ADD COLUMN features JSONB;
```

#### Migration Process
1. **Created New Tables**: vehicle_features and vehicle_feature_mappings
2. **Data Migration**: Extracted JSON features and normalized them
3. **Created Default Features**: Populated common features across categories
4. **Migrated Associations**: Converted JSON arrays to mapping table records
5. **Removed JSON Column**: Cleaned up old features column
6. **Completed Migration**: Removed old JSON column from vehicles table

#### Direct Query Approach (Recommended)
After the migration from JSON to relational structure, vehicle features should be queried using the junction table approach:

```sql
-- Get vehicle with features
SELECT 
    v.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', vf.id,
                'name', vf.name,
                'slug', vf.slug,
                'icon', vf.icon,
                'category', vf.category,
                'description', vf.description
            )
        ) FILTER (WHERE vf.id IS NOT NULL),
        '[]'::json
    ) as features
FROM vehicles v
LEFT JOIN vehicle_feature_mappings vfm ON v.id = vfm.vehicle_id
LEFT JOIN vehicle_features vf ON vfm.feature_id = vf.id AND vf.is_active = true
WHERE v.id = $1
GROUP BY v.id;
```

Note: The backward compatibility view `vehicles_with_features` has been removed as it was no longer needed.

## Access Control and Permissions

### Admin Access (`/admin/vehicle-features`)

#### Full CRUD Operations
- **Create Features**: Add new features with all properties
- **Read Features**: View all features (active and inactive)
- **Update Features**: Edit any feature property
- **Delete Features**: Remove features (with usage validation)

#### Administrative Capabilities
- **Bulk Operations**: Toggle status, bulk delete
- **Category Management**: Organize features by categories
- **Status Control**: Activate/deactivate features globally
- **Usage Monitoring**: View which vehicles use specific features

#### Admin Interface Features
```typescript
// Admin page structure
/admin/vehicle-features/
├── page.tsx              // Main listing with filters
├── new/
│   └── page.tsx         // Create new feature
├── [id]/
│   └── edit/
│       └── page.tsx     // Edit existing feature
├── actions.ts           // Server actions
└── components/
    ├── feature-form.tsx
    ├── feature-table.tsx
    └── feature-filters.tsx
```

### Vendor Access (`/vendor/vehicle-features`)

#### Read-Only Access
- **View Active Features**: Only see features marked as active
- **Category Browse**: Browse features organized by category
- **Search Features**: Search by name or description
- **No Management**: Cannot create, edit, or delete features

#### Feature Selection in Vehicle Forms
- **Multi-select Interface**: Choose multiple features per vehicle
- **Category Organization**: Features grouped by category for easy selection
- **Real-time Updates**: Form state updates immediately

#### Vendor Interface Features
```typescript
// Vendor page structure
/vendor/vehicle-features/
├── page.tsx              // Read-only listing
├── actions.ts           // Read-only server actions
└── components/
    └── feature-list.tsx  // Display component only
```

### Row Level Security (RLS) Policies

#### Vehicle Features Table
```sql
-- Read access for everyone (public reference data)
CREATE POLICY "Anyone can view active vehicle features" ON vehicle_features
    FOR SELECT USING (is_active = true OR auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'admin'
    ));

-- Write access only for admins
CREATE POLICY "Only admins can modify vehicle features" ON vehicle_features
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );
```

#### Vehicle Feature Mappings Table
```sql
-- Read access for everyone
CREATE POLICY "Anyone can view vehicle feature mappings" ON vehicle_feature_mappings
    FOR SELECT USING (true);

-- Vendors can manage their own vehicle features
CREATE POLICY "Vendors can manage their vehicle features" ON vehicle_feature_mappings
    FOR ALL USING (
        vehicle_id IN (
            SELECT id FROM vehicles 
            WHERE business_id IN (
                SELECT id FROM vendor_applications 
                WHERE user_id = auth.uid() AND status = 'approved'
            )
        )
    );

-- Admins can manage all vehicle features
CREATE POLICY "Admins can manage all vehicle features" ON vehicle_feature_mappings
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );
```

## API Endpoints and Server Actions

### Admin Actions (`/admin/vehicle-features/actions.ts`)

#### Core CRUD Operations
```typescript
// Get paginated features with filtering
export async function getVehicleFeatures(filters: FeatureFilters): Promise<PaginatedFeatures>

// Get single feature by ID
export async function getVehicleFeature(id: string): Promise<VehicleFeature | null>

// Create new feature (admin only)
export async function createVehicleFeature(data: FeatureFormData): Promise<ActionResult>

// Update existing feature (admin only)
export async function updateVehicleFeature(id: string, data: FeatureFormData): Promise<ActionResult>

// Delete feature with usage validation (admin only)
export async function deleteVehicleFeature(id: string): Promise<ActionResult>

// Toggle feature active status (admin only)
export async function toggleFeatureStatus(id: string, isActive: boolean): Promise<ActionResult>

// Get only active features for forms
export async function getActiveVehicleFeatures(): Promise<VehicleFeature[]>

// Bulk operations
export async function bulkDeleteFeatures(ids: string[]): Promise<ActionResult>
export async function bulkToggleFeatures(ids: string[], isActive: boolean): Promise<ActionResult>
```

#### Feature Usage Validation
```typescript
// Check if feature is being used by vehicles
export async function getFeatureUsageCount(featureId: string): Promise<number>

// Validate before deletion
export async function canDeleteFeature(featureId: string): Promise<boolean>
```

### Vendor Actions (`/vendor/vehicle-features/actions.ts`)

#### Read-Only Operations
```typescript
// Get active features for vendor view
export async function getVehicleFeatures(filters: FeatureFilters): Promise<PaginatedFeatures>

// Get single active feature
export async function getVehicleFeature(id: string): Promise<VehicleFeature | null>

// Get active features for vehicle forms
export async function getActiveVehicleFeatures(): Promise<VehicleFeature[]>
```

### Vehicle Management Actions

#### Feature Mapping Operations
```typescript
// Get features for a specific vehicle
export async function getVehicleFeatures(vehicleId: string): Promise<string[]>

// Update vehicle features (used in vehicle CRUD)
export async function updateVehicleFeatures(vehicleId: string, featureIds: string[]): Promise<void>
```

## Vehicle Form Integration

### Feature Selection Process

#### 1. Loading Features
```typescript
// In vehicle form component
const [features, setFeatures] = useState<VehicleFeature[]>([])
const [loadingFeatures, setLoadingFeatures] = useState(true)

useEffect(() => {
  async function loadFeatures() {
    try {
      const featuresData = await getActiveVehicleFeatures()
      setFeatures(featuresData)
    } catch (error) {
      toast.error("Failed to load features")
    } finally {
      setLoadingFeatures(false)
    }
  }
  loadFeatures()
}, [])
```

#### 2. Feature Selection UI
```typescript
// Grouped checkbox interface
<FormField
  control={form.control}
  name="feature_ids"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Available Features</FormLabel>
      <div className="space-y-4">
        {Object.entries(
          features.reduce((acc, feature) => {
            const category = feature.category || 'other'
            if (!acc[category]) acc[category] = []
            acc[category].push(feature)
            return acc
          }, {} as Record<string, VehicleFeature[]>)
        ).map(([category, categoryFeatures]) => (
          <div key={category}>
            <h4 className="text-sm font-medium mb-3 capitalize">{category}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categoryFeatures.map((feature) => (
                <div key={feature.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={feature.id}
                    checked={field.value?.includes(feature.id) || false}
                    onCheckedChange={(checked) => {
                      const current = field.value || []
                      if (checked) {
                        field.onChange([...current, feature.id])
                      } else {
                        field.onChange(current.filter(id => id !== feature.id))
                      }
                    }}
                  />
                  <label htmlFor={feature.id} className="text-sm cursor-pointer">
                    {feature.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </FormItem>
  )}
/>
```

### Feature Mapping Management

#### Creating Vehicle with Features
```typescript
export async function createVehicle(businessId: string, data: VehicleFormData) {
  // 1. Create vehicle record
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .insert(vehicleData)
    .select()
    .single()

  if (error) return { error: error.message }

  // 2. Handle feature mappings
  if (data.feature_ids && data.feature_ids.length > 0) {
    const featureMappings = data.feature_ids.map(featureId => ({
      vehicle_id: vehicle.id,
      feature_id: featureId
    }))

    const { error: featureError } = await supabase
      .from('vehicle_feature_mappings')
      .insert(featureMappings)

    if (featureError) {
      console.error('Error adding vehicle features:', featureError)
    }
  }

  return { success: true }
}
```

#### Updating Vehicle Features
```typescript
export async function updateVehicle(vehicleId: string, data: VehicleFormData) {
  // 1. Update vehicle basic data
  const { error } = await supabase
    .from('vehicles')
    .update(vehicleData)
    .eq('id', vehicleId)

  if (error) return { error: error.message }

  // 2. Handle feature mappings - replace all
  // First delete existing mappings
  await supabase
    .from('vehicle_feature_mappings')
    .delete()
    .eq('vehicle_id', vehicleId)

  // Then add new mappings
  if (data.feature_ids && data.feature_ids.length > 0) {
    const featureMappings = data.feature_ids.map(featureId => ({
      vehicle_id: vehicleId,
      feature_id: featureId
    }))

    await supabase
      .from('vehicle_feature_mappings')
      .insert(featureMappings)
  }

  return { success: true }
}
```

#### Loading Existing Features for Edit
```typescript
// Get existing feature selections for vehicle editing
export async function getVehicleFeatures(vehicleId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('vehicle_feature_mappings')
    .select('feature_id')
    .eq('vehicle_id', vehicleId)

  if (error) {
    console.error('Error fetching vehicle features:', error)
    return []
  }

  return data.map(mapping => mapping.feature_id)
}
```

## UI Components and User Experience

### Admin Interface Components

#### FeatureForm Component
```typescript
interface FeatureFormData {
  name: string
  slug?: string
  icon?: string
  category: FeatureCategory
  description?: string
  sort_order: number
  is_active: boolean
}
```

**Features:**
- Auto-slug generation from name
- Category dropdown with predefined options
- Icon selection (optional)
- Real-time validation
- Loading states

#### FeatureTable Component
**Features:**
- Sortable columns (name, category, sort_order, is_active)
- Row selection for bulk operations
- Quick status toggle buttons
- Usage count display
- Action buttons (edit, delete)
- Responsive design

#### FeatureFilters Component
**Features:**
- Search by name or description
- Filter by category
- Filter by active/inactive status
- Sort options
- Pagination controls

### Vendor Interface Components

#### FeatureList Component (Read-Only)
**Features:**
- Category-grouped display
- Search functionality
- Clean, read-only interface
- Feature descriptions on hover
- Responsive grid layout

### Common UI Patterns

#### Category Display
```typescript
const categoryColors = {
  safety: 'bg-red-100 text-red-800',
  comfort: 'bg-blue-100 text-blue-800',
  technology: 'bg-green-100 text-green-800',
  entertainment: 'bg-purple-100 text-purple-800',
  convenience: 'bg-yellow-100 text-yellow-800',
  performance: 'bg-orange-100 text-orange-800',
}

<Badge className={categoryColors[feature.category]}>
  {feature.category}
</Badge>
```

## Data Integrity and Validation

### Form Validation Schemas

#### Feature Creation/Update
```typescript
const featureSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only")
    .optional(),
  icon: z.string().optional(),
  category: z.enum(['safety', 'comfort', 'technology', 'entertainment', 'convenience', 'performance']),
  description: z.string().optional(),
  sort_order: z.number().min(0, "Sort order must be 0 or greater"),
  is_active: z.boolean().default(true),
})
```

#### Vehicle Feature Selection
```typescript
const vehicleSchema = z.object({
  // ... other fields
  feature_ids: z.array(z.string().uuid()).optional(),
})
```

### Database Constraints

#### Unique Constraints
```sql
-- Prevent duplicate feature names
ALTER TABLE vehicle_features ADD CONSTRAINT uk_vehicle_features_name UNIQUE (name);

-- Prevent duplicate slugs
ALTER TABLE vehicle_features ADD CONSTRAINT uk_vehicle_features_slug UNIQUE (slug);

-- Prevent duplicate vehicle-feature mappings
ALTER TABLE vehicle_feature_mappings ADD CONSTRAINT uk_vehicle_feature_mappings UNIQUE (vehicle_id, feature_id);
```

#### Check Constraints
```sql
-- Ensure valid categories
ALTER TABLE vehicle_features ADD CONSTRAINT chk_vehicle_features_category 
CHECK (category IN ('safety', 'comfort', 'technology', 'entertainment', 'convenience', 'performance'));

-- Ensure positive sort order
ALTER TABLE vehicle_features ADD CONSTRAINT chk_vehicle_features_sort_order 
CHECK (sort_order >= 0);
```

#### Foreign Key Constraints
```sql
-- Ensure referential integrity
ALTER TABLE vehicle_feature_mappings 
ADD CONSTRAINT fk_vehicle_feature_mappings_vehicle_id 
FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;

ALTER TABLE vehicle_feature_mappings 
ADD CONSTRAINT fk_vehicle_feature_mappings_feature_id 
FOREIGN KEY (feature_id) REFERENCES vehicle_features(id) ON DELETE CASCADE;
```

### Usage Validation

#### Before Feature Deletion
```typescript
export async function validateFeatureDeletion(featureId: string): Promise<ValidationResult> {
  const usageCount = await getFeatureUsageCount(featureId)
  
  if (usageCount > 0) {
    return {
      valid: false,
      message: `Cannot delete feature. It is currently used by ${usageCount} vehicle(s).`
    }
  }
  
  return { valid: true }
}
```

## Performance Optimizations

### Database Indexes

#### Core Indexes
```sql
-- Speed up vehicle feature lookups
CREATE INDEX idx_vehicle_feature_mappings_vehicle_id ON vehicle_feature_mappings(vehicle_id);
CREATE INDEX idx_vehicle_feature_mappings_feature_id ON vehicle_feature_mappings(feature_id);

-- Speed up feature filtering
CREATE INDEX idx_vehicle_features_slug ON vehicle_features(slug);
CREATE INDEX idx_vehicle_features_category ON vehicle_features(category);
CREATE INDEX idx_vehicle_features_is_active ON vehicle_features(is_active);
CREATE INDEX idx_vehicle_features_sort_order ON vehicle_features(sort_order);

-- Composite index for common queries
CREATE INDEX idx_vehicle_features_active_category ON vehicle_features(is_active, category) WHERE is_active = true;
```

#### Query Optimization

#### Efficient Feature Loading
```sql
-- Get vehicle with features in single query
SELECT 
    v.*,
    json_agg(
        json_build_object(
            'id', vf.id,
            'name', vf.name,
            'category', vf.category,
            'icon', vf.icon
        )
    ) FILTER (WHERE vf.id IS NOT NULL) as features
FROM vehicles v
LEFT JOIN vehicle_feature_mappings vfm ON v.id = vfm.vehicle_id
LEFT JOIN vehicle_features vf ON vfm.feature_id = vf.id AND vf.is_active = true
WHERE v.id = $1
GROUP BY v.id;
```

#### Paginated Feature Listing with Counts
```sql
SELECT 
    vf.*,
    COUNT(vfm.vehicle_id) as usage_count
FROM vehicle_features vf
LEFT JOIN vehicle_feature_mappings vfm ON vf.id = vfm.feature_id
WHERE ($1::text IS NULL OR vf.name ILIKE '%' || $1 || '%')
  AND ($2::text IS NULL OR vf.category = $2)
  AND ($3::boolean IS NULL OR vf.is_active = $3)
GROUP BY vf.id
ORDER BY vf.sort_order, vf.name
LIMIT $4 OFFSET $5;
```

### Application-Level Optimizations

#### Caching Strategies
```typescript
// Cache active features for forms
const activeFeatures = useMemo(async () => {
  return await getActiveVehicleFeatures()
}, [])

// Debounced search
const debouncedSearch = useDebounce(searchTerm, 300)
```

#### Batch Operations
```typescript
// Bulk feature updates
export async function updateMultipleVehicleFeatures(
  updates: Array<{ vehicleId: string; featureIds: string[] }>
) {
  // Use transaction for consistency
  const { error } = await supabase.rpc('bulk_update_vehicle_features', {
    updates: updates
  })
  
  return { error }
}
```

## Error Handling and Logging

### Comprehensive Error Handling
```typescript
export async function createVehicleFeature(data: FeatureFormData) {
  try {
    // Validate admin permissions
    const user = await requireAdmin()
    
    // Create feature
    const { data: feature, error } = await supabase
      .from('vehicle_features')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Database error creating feature:', error)
      return { error: 'Failed to create feature' }
    }

    revalidatePath('/admin/vehicle-features')
    return { data: feature }
    
  } catch (error) {
    console.error('Unexpected error creating feature:', error)
    return { error: 'An unexpected error occurred' }
  }
}
```

### User-Friendly Error Messages
```typescript
const errorMessages = {
  UNIQUE_VIOLATION: 'A feature with this name already exists',
  FOREIGN_KEY_VIOLATION: 'Cannot delete feature that is in use',
  PERMISSION_DENIED: 'You do not have permission to perform this action',
  NOT_FOUND: 'Feature not found',
}
```

## Best Practices

### Feature Management
- **Consistent Naming**: Use clear, descriptive feature names
- **Category Organization**: Group related features appropriately
- **Regular Cleanup**: Review and remove unused features
- **Status Management**: Use is_active flag instead of deletion when possible

### Performance Guidelines
- **Efficient Queries**: Use appropriate indexes and avoid N+1 queries
- **Batch Operations**: Group related database operations
- **Caching**: Cache frequently accessed feature lists
- **Pagination**: Always paginate large feature lists

### Data Integrity
- **Validation**: Validate data at multiple levels (client, server, database)
- **Transactions**: Use transactions for multi-table operations
- **Constraints**: Leverage database constraints for data integrity
- **Regular Audits**: Periodically audit feature usage and consistency

### User Experience
- **Loading States**: Show loading indicators during async operations
- **Error Feedback**: Provide clear, actionable error messages
- **Confirmation Dialogs**: Confirm destructive operations
- **Responsive Design**: Ensure forms work on all device sizes

## Future Enhancements

### Potential Features
- **Feature Templates**: Predefined feature sets for common vehicle types
- **Custom Categories**: Allow admins to define custom feature categories
- **Feature Dependencies**: Define relationships between features
- **Localization**: Multi-language feature names and descriptions
- **Analytics**: Track feature popularity and usage trends
- **Versioning**: Track changes to feature definitions over time
- **API Integration**: External integrations for feature data
- **Advanced Filtering**: More sophisticated filtering options for customers
- **Feature Groups**: Bundle related features for easier selection
- **Conditional Features**: Show/hide features based on vehicle type or category