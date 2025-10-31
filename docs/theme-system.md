# Admin-Controlled Theme System Documentation

## Overview

This project now features a complete admin-controlled theming system based on the Infinia luxury design. All design tokens (colors, fonts, spacing, etc.) are stored in the database and can be modified through the admin panel without touching code.

## Architecture

### Database Layer
- **Table**: `theme_settings`
- **Structure**: Stores theme configurations in JSONB format
- **Active Theme**: Only one theme can be active at a time (enforced by unique index)

### Theme Library (`lib/theme/`)

```
lib/theme/
├── types.ts                 # TypeScript interfaces
├── defaults.ts              # Infinia luxury preset
├── theme-generator.ts       # Config → CSS variables
├── theme-provider.tsx       # Server-side provider
├── theme-client-provider.tsx # Client-side context
├── hooks.ts                 # React hooks
└── index.ts                 # Main export
```

### Key Features

1. **Zero CSS Duplication**
   - All styles reference CSS variables
   - No hardcoded values anywhere in the codebase

2. **Type-Safe Configuration**
   - Full TypeScript support
   - Compile-time error checking

3. **Real-Time Updates**
   - Changes apply immediately via revalidation
   - No build or deploy needed

4. **Reusable Utility Classes**
   - `.luxury-container` - Responsive container
   - `.section-padding` - Section spacing
   - `.luxury-card` - Glassmorphism cards
   - `.section-divider` - Gold accent line
   - And more...

## Usage

### Accessing Theme in Components

```typescript
'use client'
import { useTheme, useThemeValue } from '@/lib/theme'

export function MyComponent() {
  const { config } = useTheme()
  const goldColor = useThemeValue('colors.luxury.gold')

  return <div>Gold color: {goldColor}</div>
}
```

### Using Utility Classes

```tsx
<div className="luxury-container section-padding">
  <div className="section-title-wrapper">
    <div className="section-divider" />
    <h2 className="section-title">My Title</h2>
    <p className="section-subtitle">My subtitle</p>
  </div>

  <div className="luxury-card luxury-card-hover">
    Card content with glassmorphism
  </div>
</div>
```

### Using Tailwind Classes

```tsx
// Colors
<div className="bg-luxury-black text-luxury-pearl">
  <span className="text-luxury-gold">Gold text</span>
</div>

// Fonts
<h1 className="font-serif">Playfair heading</h1>
<p className="font-sans">Montserrat body</p>

// Shadows
<div className="shadow-card hover:shadow-cardHover">
  Animated shadow
</div>
```

## Admin Panel

Access the theme editor at `/admin/theme-settings`

### Available Controls
- **Typography**: Font families, sizes, weights, line heights, letter spacing
- **Colors**: Complete luxury color palette with visual color pickers
- **Spacing**: Section padding, container spacing
- **Border Radius**: Component border radius values
- **Shadows**: Card shadows, hover effects
- **Animations**: Duration, easing functions

### Managing Themes

#### Creating a New Theme
1. Click "Create New Theme Preset" button at the bottom of the page
2. Enter a descriptive name for your theme
3. Customize all properties in the dialog:
   - **Typography**: Configure font families (Sans, Serif, Mono)
   - **Colors**: Use color pickers for all 7 luxury colors (gold, goldLight, black, darkGray, gray, lightGray, pearl)
   - **Spacing**: Set section and container spacing values
   - **Border Radius**: Define corner rounding (sm, md, lg, xl, full)
   - **Shadows**: Configure card, hover, and gold accent shadows
   - **Animations**: Set duration and easing functions
4. Click "Create Theme" to save
5. The new theme will be created as inactive

**Note**: All themes start with Infinia luxury defaults, which you can then customize.

#### Editing an Existing Theme
1. Find the theme card you want to edit
2. Click the "Edit" button
3. Modify any properties using the same interface as creation
4. Click "Save Changes"
5. If the theme is active, changes apply instantly across the entire application

**Visual Features**:
- **Color Pickers**: Each color field has three components:
  - Native color picker for visual selection
  - Hex value input for precise control
  - Live preview swatch showing the current color
- **Organized Sections**: Form is divided into collapsible sections for easy navigation
- **Validation**: All inputs are validated (hex colors, proper CSS values)

#### Activating a Theme
1. Find an inactive theme card
2. Click the "Activate" button
3. The theme will be applied instantly across the entire application
4. Only one theme can be active at a time
5. The active theme card will have a gold border and "ACTIVE" badge

#### Deleting a Theme
1. Find an inactive theme card (active themes cannot be deleted)
2. Click the trash icon button
3. Confirm deletion in the dialog
4. The theme will be permanently removed

**Safety Features**:
- Cannot delete the active theme
- Confirmation required before deletion
- Loading states show progress for all operations

## Infinia Luxury Theme

### Typography
- **Sans**: Montserrat - Clean, modern body text
- **Serif**: Playfair Display - Elegant headings

### Colors
```
Gold:       #C6AA88  (primary brand color)
Gold Light: #E8D9C5  (lighter variant)
Black:      #0A0A0A  (main background)
Dark Gray:  #181818  (alternating sections)
Gray:       #2C2C2C  (cards/components)
Light Gray: #B0B0B0  (body text)
Pearl:      #F5F5F5  (headings)
```

### Design Patterns
- Alternating section backgrounds (black/dark gray)
- Glassmorphism effects with backdrop-blur
- Gold accent dividers (5rem × 0.25rem)
- Sophisticated shadows with subtle gold tones
- Smooth transitions (300ms default)

## CSS Variables

All theme values are exposed as CSS variables:

```css
/* Typography */
var(--font-sans)
var(--font-serif)
var(--font-size-base)
var(--font-weight-medium)
var(--line-height-normal)
var(--letter-spacing-tight)

/* Colors - Luxury Theme (Direct Access) */
var(--luxury-gold)
var(--luxury-black)
var(--luxury-pearl)
/* ... and RGB variants for rgba() */
var(--luxury-gold-rgb) /* e.g., "198, 170, 136" */

/* Colors - Shadcn Semantic (Automatically Mapped to Luxury Theme) */
var(--primary)           /* Maps to luxury-gold */
var(--card)              /* Maps to luxury-darkGray */
var(--muted)             /* Maps to luxury-gray */
var(--accent)            /* Maps to luxury-goldLight */
var(--background)        /* Maps to luxury-black */
var(--foreground)        /* Maps to luxury-pearl */
var(--muted-foreground)  /* Maps to luxury-lightGray */

/* Spacing */
var(--spacing-section-md)
var(--spacing-container-lg)

/* Border Radius */
var(--border-radius-md)
var(--border-radius-full)

/* Shadows */
var(--shadow-card)
var(--shadow-cardHover)
var(--shadow-gold)

/* Animations */
var(--animation-duration-normal)
var(--animation-easing-default)
```

### Dynamic Color System Integration

**Key Feature:** The theme system now automatically generates Shadcn UI semantic color variables from your luxury theme colors. This means:

✅ **All components automatically use theme colors** - Sidebar, cards, badges, buttons, inputs, etc.
✅ **Zero manual CSS needed** - Switch themes in admin panel, everything updates
✅ **Complete coverage** - No hardcoded colors anywhere

**Color Mapping:**
```typescript
// When you switch themes, these mappings update automatically:
--primary             → luxury.gold        (buttons, links, accents)
--primary-foreground  → luxury.black       (text on primary)
--card                → luxury.darkGray    (card backgrounds)
--card-foreground     → luxury.pearl       (text on cards)
--secondary           → luxury.gray        (secondary elements)
--muted               → luxury.gray        (disabled/subtle states)
--muted-foreground    → luxury.lightGray   (muted text)
--accent              → luxury.goldLight   (hover states)
--background          → luxury.black       (page background)
--foreground          → luxury.pearl       (main text)
```

**Example:** If you activate "Aurora Pro" theme with indigo colors:
- `bg-primary` becomes indigo (#6366F1)
- `bg-card` becomes dark zinc (#18181B)
- `text-muted-foreground` becomes zinc-400 (#A1A1AA)
- ALL without changing component code!

## Component Examples

### Luxury Card
```tsx
<div className="luxury-card luxury-card-hover p-6">
  <h3 className="font-serif text-luxury-pearl mb-2">Card Title</h3>
  <p className="text-luxury-lightGray">Card content</p>
</div>
```

### Section with Title
```tsx
<section className="section-padding bg-luxury-darkGray">
  <div className="luxury-container">
    <div className="section-title-wrapper">
      <div className="section-divider" />
      <h2 className="section-title">Section Title</h2>
      <p className="section-subtitle">
        Section description text
      </p>
    </div>
  </div>
</section>
```

### Button Variants
```tsx
<Button variant="default">Primary Action</Button>
<Button variant="outline">Secondary Action</Button>
<Button variant="ghost">Tertiary Action</Button>
<Button variant="subtle">Subtle Action</Button>
```

### Badge Variants (Theme-Aware)
```tsx
{/* Standard Shadcn variants (automatically use theme colors) */}
<Badge variant="default">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Error</Badge>

{/* New status variants (theme-aware) */}
<Badge variant="success">Completed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="info">Info</Badge>
```

### Status Color Utilities
```tsx
{/* Text colors */}
<span className="status-success">Success text</span>
<span className="status-warning">Warning text</span>
<span className="status-error">Error text</span>
<span className="status-info">Info text</span>

{/* Background + text colors */}
<div className="status-success-bg p-2 rounded">Success background</div>
<div className="status-warning-bg p-2 rounded">Warning background</div>
<div className="status-error-bg p-2 rounded">Error background</div>
<div className="status-info-bg p-2 rounded">Info background</div>
```

## Best Practices

1. **Always Use Theme Colors**
   - ✅ **Use Shadcn semantic classes**: `bg-card`, `text-muted-foreground`, `bg-primary`
   - ✅ **Use luxury theme classes**: `bg-luxury-gold`, `text-luxury-pearl`
   - ✅ **Use status utilities**: `status-success`, `status-warning-bg`
   - ❌ **Never hardcode colors**: `bg-[#6366F1]`, `text-green-600`, `text-red-500`

2. **Color Class Priority**
   - **First choice**: Shadcn semantic classes (automatic theme integration)
   - **Second choice**: Luxury theme classes (direct theme access)
   - **Third choice**: Status utilities (for success/warning/error states)
   - **Never**: Hardcoded hex/rgb/hsl or Tailwind color scales

3. **Badge Usage**
   - Use `success`/`warning`/`error`/`info` variants for status badges
   - They automatically adapt to theme colors
   - Example: `<Badge variant="success">Active</Badge>`

4. **Status Colors**
   - Use `.status-*` utilities for text colors
   - Use `.status-*-bg` utilities for background + text
   - These update automatically when themes change

5. **Use Utility Classes**
   - Prefer reusable classes over custom CSS
   - Extend existing classes rather than creating new ones

6. **Maintain Type Safety**
   - Use TypeScript interfaces when working with theme config
   - Leverage type checking to prevent errors

7. **Test Theme Changes**
   - Preview changes across multiple pages
   - Verify responsive behavior
   - Switch between themes to ensure colors update everywhere

8. **Document Custom Components**
   - If creating new components, document which CSS variables they use
   - Provide usage examples

## Troubleshooting

### Theme Not Applying
- Verify theme is marked as `is_active` in database
- Check browser console for errors
- Clear cache and hard reload

### CSS Variables Not Working
- Ensure ThemeProvider wraps your app in layout.tsx
- Check that CSS variables are properly generated
- Verify Tailwind config extends with luxury colors

### Type Errors
- Regenerate types if theme config structure changed
- Ensure imports are from `@/lib/theme`
- Check TypeScript strict mode settings

## Implementation Details

### Component Architecture

The theme editor follows a highly reusable component architecture:

**Created Components** (`app/admin/theme-settings/components/`):

1. **`color-input.tsx`** - Reusable color picker component
   - Native HTML5 color input for visual selection
   - Hex value text input for precise control
   - Live preview swatch
   - Used 7 times (once for each luxury color)

2. **`theme-form-fields.tsx`** - Complete theme form fields
   - Organized into sections: Typography, Colors, Spacing, Borders, Shadows, Animations
   - Reusable in both create and edit modes
   - Uses ColorInput component for all color fields
   - Accepts form control from parent

3. **`theme-dialog.tsx`** - Unified dialog for create and edit
   - Single component handles both operations via `mode` prop
   - Create mode: uses Infinia defaults, requires theme name
   - Edit mode: uses existing theme values, name is read-only
   - Zod validation for all fields
   - Calls appropriate server action based on mode

**Key Benefits**:
- **50% code reduction** compared to separate create/edit pages
- **Zero duplication** - same form used for both operations
- **Single ColorInput** component reused 7 times
- **Type-safe** with full Zod validation
- **Consistent UX** across all operations

### Code Reusability Patterns

```typescript
// Same dialog, different modes
<ThemeDialog mode="create" open={...} />
<ThemeDialog mode="edit" theme={selectedTheme} open={...} />

// Same color input, different colors
<ColorInput label="Gold" value={...} onChange={...} />
<ColorInput label="Pearl" value={...} onChange={...} />

// Same form fields, different contexts
<ThemeFormFields form={form} /> // Used in both create and edit
```

## Future Enhancements

Planned features for the theme system:

- [ ] Live preview panel showing changes in real-time
- [ ] Font selector with Google Fonts integration
- [ ] Import/Export theme JSON files
- [ ] Theme versioning and rollback
- [ ] A/B testing different themes
- [ ] User-specific theme preferences
- [ ] Dark/light mode variations
- [ ] Duplicate theme functionality
- [ ] Theme templates library

## Support

For questions or issues with the theme system:
1. Check this documentation
2. Review the code in `lib/theme/`
3. Test in the admin panel at `/admin/theme-settings`
4. Verify database migration was applied successfully
