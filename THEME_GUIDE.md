# Vehicle Service Admin Theme Guide

## Overview
This admin panel uses a modern, clean design inspired by industry-leading dashboards like Vercel, Linear, and Stripe. The theme is built with consistency, accessibility, and developer experience in mind.

## Design Principles

### 1. Clean & Minimal
- Focus on content with minimal visual noise
- Strategic use of whitespace
- Clear visual hierarchy

### 2. Consistent
- Unified color system with CSS variables
- Standardized spacing and typography
- Reusable component patterns

### 3. Accessible
- Full dark/light mode support
- High contrast ratios
- Keyboard navigation friendly

### 4. Responsive
- Mobile-first approach
- Adaptive layouts
- Touch-friendly interactions

## Color System

### CSS Variables
All colors are defined as HSL values in CSS variables for easy theming:

```css
--primary: 240 5.9% 10%;          /* Main brand color */
--secondary: 240 4.8% 95.9%;      /* Secondary actions */
--muted: 240 4.8% 95.9%;         /* Subdued elements */
--accent: 240 4.8% 95.9%;        /* Highlights */
--destructive: 0 84.2% 60.2%;    /* Errors/deletions */
```

### Usage Examples
```tsx
<Button variant="default">Primary Action</Button>
<Badge variant="secondary">Status</Badge>
<Card className="bg-muted">Content</Card>
```

## Typography System

### Utility Classes
```css
.h1    /* 4xl/5xl - Page titles */
.h2    /* 3xl - Section headers */
.h3    /* 2xl - Card titles */
.h4    /* xl - Subsections */
.p     /* Base - Body text */
.lead  /* xl - Intro text */
.large /* lg - Emphasized text */
.small /* sm - Supporting text */
.muted /* sm - De-emphasized */
```

### Font Stack
```css
font-family: Inter, system-ui, -apple-system, sans-serif;
```

## Component Architecture

### Layout Components
- **AdminLayout**: Main wrapper with sidebar and header
- **Sidebar**: Collapsible navigation with icons
- **Header**: Top bar with search, theme toggle, and user menu

### UI Components
All components follow the compound component pattern:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Component Variants
Most components support variants for different states:

```tsx
<Button variant="default|secondary|destructive|outline|ghost|link" />
<Badge variant="default|secondary|destructive|outline" />
```

## Spacing System

Based on Tailwind's spacing scale:
- `space-y-1` to `space-y-8` for vertical spacing
- `gap-1` to `gap-8` for grid/flex gaps
- `p-2`, `p-4`, `p-6` for padding
- `m-2`, `m-4`, `m-6` for margins

## Dark Mode Implementation

### Automatic Detection
The theme automatically detects and respects system preferences:

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
>
```

### Manual Toggle
Users can override with the theme toggle in the header.

### Color Adjustments
Dark mode inverts the color scale while maintaining contrast:
- Backgrounds become dark
- Text becomes light
- Borders become subtle
- Shadows are removed

## Best Practices

### 1. Use Semantic Components
```tsx
// Good
<Card>
  <CardHeader>
    <CardTitle>Revenue</CardTitle>
  </CardHeader>
  <CardContent>$1,234</CardContent>
</Card>

// Avoid
<div className="rounded-lg border p-6">
  <h3>Revenue</h3>
  <p>$1,234</p>
</div>
```

### 2. Leverage Utility Classes
```tsx
// Good
<div className="flex items-center gap-4">

// Avoid
<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
```

### 3. Maintain Consistency
- Always use theme colors via CSS variables
- Follow established spacing patterns
- Use provided component variants

### 4. Responsive Design
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* Content adapts to screen size */}
</div>
```

## Common Patterns

### Data Display
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Forms
```tsx
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" />
  </div>
  <Button type="submit">Submit</Button>
</form>
```

### Cards Grid
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <StatCard title="Revenue" value="$1,234" />
  <StatCard title="Users" value="567" />
</div>
```

## Animation & Transitions

Subtle animations enhance the experience:
- `transition-colors` for hover states
- `transition-all duration-300` for layout changes
- CSS animations for accordions and dropdowns

## Extending the Theme

### Adding New Colors
1. Add to CSS variables in `globals.css`
2. Update Tailwind config
3. Create component variants

### Creating New Components
1. Follow existing patterns
2. Use compound component structure
3. Support dark mode
4. Add proper TypeScript types
5. Keep under 200 lines

### Custom Styles
When needed, use the `cn()` utility to merge classes:

```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  conditional && "conditional-classes",
  className
)} />
```

## Resources

- Tailwind CSS Documentation
- Radix UI Component Docs
- Shadcn UI Component Examples
- Next.js App Router Guide