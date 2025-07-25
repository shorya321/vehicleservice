# Vehicle Categories Module

## Overview

The Vehicle Categories module provides a comprehensive system for managing and organizing vehicle types in the rental platform. It enables administrators to create, manage, and maintain standardized vehicle categories that help customers find appropriate vehicles and provide consistent classification across the platform.

## Purpose

- **Standardization**: Ensure consistent vehicle classification across the platform
- **Organization**: Help customers easily browse and filter vehicles by type
- **Admin Control**: Centralized management of vehicle categories
- **SEO Optimization**: URL-friendly slugs for better search engine visibility
- **Visual Enhancement**: Support for category images to improve user experience

## Database Schema

### Table: `vehicle_categories`

```sql
CREATE TABLE vehicle_categories (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Field Descriptions:**
- `id`: Unique identifier (VARCHAR for custom IDs like 'economy', 'business')
- `name`: Display name shown to users (e.g., "Economy", "Business Class")
- `slug`: URL-friendly version for routing and SEO
- `description`: Optional detailed description of the category
- `sort_order`: Controls display order (lower numbers appear first)
- `image_url`: Optional category image stored in Supabase Storage
- `created_at`: Automatic timestamp when category is created
- `updated_at`: Automatic timestamp when category is modified

### Foreign Key Relationships

```sql
-- Vehicles table references categories
ALTER TABLE vehicles 
ADD CONSTRAINT fk_vehicles_category 
FOREIGN KEY (category_id) REFERENCES vehicle_categories(id);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;

-- Read access for everyone (public reference data)
CREATE POLICY "Anyone can view vehicle categories" ON vehicle_categories
    FOR SELECT USING (true);

-- Write access only for admins
CREATE POLICY "Only admins can insert vehicle categories" ON vehicle_categories
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

CREATE POLICY "Only admins can update vehicle categories" ON vehicle_categories
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete vehicle categories" ON vehicle_categories
    FOR DELETE USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );
```

### Default Categories

The system comes with predefined categories:

| ID | Name | Description |
|---|---|---|
| economy | Economy | Budget-friendly vehicles for cost-conscious travelers |
| comfort | Comfort | Standard comfort vehicles with good features and space |
| business | Business | Premium and luxury vehicles for business travelers |
| minibus | Minibus | Large capacity vehicles for group transportation |

## Admin Management Interface

### Main Features

#### 1. Category Listing (`/admin/vehicle-categories`)
- **Paginated Table**: Displays categories with sorting options
- **Search Functionality**: Search by name or description
- **Usage Count**: Shows how many vehicles use each category
- **Bulk Actions**: Select multiple categories for bulk operations
- **Status Indicators**: Visual status of each category

#### 2. Create Category (`/admin/vehicle-categories/new`)
- **Form Validation**: Client and server-side validation
- **Auto-slug Generation**: Automatic creation of URL-friendly slugs
- **Image Upload**: Category image upload to Supabase Storage
- **Sort Order**: Manual ordering for display priority

#### 3. Edit Category (`/admin/vehicle-categories/[id]/edit`)
- **Pre-populated Form**: Existing data loaded for editing
- **Image Management**: Replace or remove existing images
- **Usage Validation**: Prevents deletion if category is in use

### UI Components

#### CategoryForm Component
```typescript
interface CategoryFormData {
  name: string
  slug?: string
  description?: string
  sort_order: number
  image?: File
}
```

**Features:**
- Real-time slug generation from name
- Image preview and removal
- Form validation with Zod schema
- Loading states for async operations

#### CategoryTable Component
**Features:**
- Sortable columns (name, sort_order, created_at)
- Row selection for bulk operations
- Action buttons (edit, delete)
- Usage count display
- Responsive design

#### CategoryFilters Component
**Features:**
- Search input with debouncing
- Sort direction toggle
- Results per page selection
- Reset filters functionality

### Bulk Operations

#### Bulk Delete
- Select multiple categories using checkboxes
- Validation prevents deletion of categories in use
- Confirmation dialog before deletion
- Success/error feedback

## API Endpoints and Server Actions

### Core Actions

#### `getCategories(filters: CategoryFilters)`
```typescript
interface CategoryFilters {
  search?: string
  sortBy?: 'name' | 'sort_order' | 'created_at'
  sortDirection?: 'asc' | 'desc'
  page?: number
  limit?: number
}
```

**Returns:** Paginated list of categories with usage counts

#### `createCategory(data: CategoryFormData)`
- Validates admin permissions
- Auto-generates slug if not provided
- Handles image upload to Supabase Storage
- Returns created category or error

#### `updateCategory(id: string, data: CategoryFormData)`
- Admin permission validation
- Preserves existing image if not changed
- Updates slug if name changed
- Handles image replacement

#### `deleteCategory(id: string)`
- Checks if category is in use by vehicles
- Prevents deletion if vehicles exist with this category
- Removes associated images from storage
- Admin permission required

#### `bulkDeleteCategories(ids: string[])`
- Validates each category for usage
- Performs batch deletion
- Handles partial failures gracefully

### Helper Functions

#### `getCategoryUsageCount(categoryId: string)`
Returns count of vehicles using the category

#### `getVehicleCategories()`
Returns all categories ordered by sort_order for dropdown use

## Integration with Vehicle Forms

### Category Selection

In vehicle creation/editing forms:

```typescript
// Load categories for dropdown
const { data: categories } = await getVehicleCategories()

// Form field for category selection
<FormField
  control={form.control}
  name="category_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Category</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select vehicle category" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Validation

Category selection is required in vehicle forms:
```typescript
const vehicleSchema = z.object({
  // ... other fields
  category_id: z.string().min(1, "Category is required"),
})
```

## Image Management

### Upload Process

1. **Client Side**: User selects image file
2. **Validation**: File type and size validation
3. **Base64 Conversion**: File converted for transmission
4. **Server Upload**: Image uploaded to Supabase Storage
5. **URL Generation**: Public URL generated and stored

### Storage Structure
```
vehicle-categories/
  ├── category-id-1/
  │   └── image-timestamp.jpg
  ├── category-id-2/
  │   └── image-timestamp.png
  └── ...
```

### Image Component
```typescript
<ImageUpload
  label="Category Image"
  description="Upload an image to represent this category"
  value={imageUrl}
  onChange={handleImageChange}
  onRemove={handleImageRemove}
  disabled={isLoading}
/>
```

## Usage Tracking and Validation

### Usage Count Query
```sql
SELECT 
  vc.*,
  COUNT(v.id) as usage_count
FROM vehicle_categories vc
LEFT JOIN vehicles v ON v.category_id = vc.id
GROUP BY vc.id
ORDER BY vc.sort_order;
```

### Deletion Prevention
Categories cannot be deleted if:
- Any vehicles are assigned to the category
- System validates before deletion
- User receives clear error message

## Technical Implementation Details

### Zod Validation Schema
```typescript
const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only").optional(),
  description: z.string().optional(),
  sort_order: z.number().min(0, "Sort order must be 0 or greater"),
})
```

### Auto-slug Generation
```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}
```

### Error Handling
- Comprehensive try-catch blocks
- User-friendly error messages
- Proper HTTP status codes
- Logging for debugging

### Performance Considerations
- Database indexes on frequently queried fields
- Pagination for large datasets
- Optimized queries with proper JOINs
- Image optimization and CDN usage

## Best Practices

### Category Naming
- Use clear, descriptive names
- Maintain consistency across categories
- Consider localization for international use

### Image Guidelines
- Use high-quality images
- Consistent aspect ratios
- Optimize file sizes
- Include alt text for accessibility

### Sort Order Management
- Leave gaps between sort orders (10, 20, 30) for future insertions
- Group related categories with similar sort orders
- Review and reorganize periodically

### Data Integrity
- Always validate category usage before deletion
- Maintain referential integrity
- Regular database maintenance

## Future Enhancements

### Potential Features
- **Localization**: Multi-language category names
- **Custom Fields**: Additional metadata per category
- **Category Hierarchy**: Sub-categories and parent-child relationships
- **Analytics**: Category performance metrics
- **SEO Metadata**: Custom meta descriptions and keywords
- **Category Colors**: Brand colors for visual consistency