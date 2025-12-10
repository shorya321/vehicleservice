# Business Portal Style Guide

> Premium Indigo Design System - Stripe/Linear/Apple Inspired

This guide establishes the design system standards for the Business Portal. All new components and pages MUST follow these guidelines to maintain visual consistency.

---

## Quick Reference

### Import Patterns

```tsx
// CORRECT - Use business components
import {
  LuxuryCard,
  LuxuryCardHeader,
  LuxuryCardTitle,
  LuxuryCardContent,
  LuxuryButton,
  LuxuryInput,
  LuxuryLabel,
  StatusBadge,
} from '@/components/business/ui';

import { PageHeader, PageContainer, Section } from '@/components/business/layout';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/business/motion';

// FORBIDDEN - Never use shared UI in business pages
// import { Card } from '@/components/ui/card';  // NO!
// import { Button } from '@/components/ui/button';  // NO!
```

### Color Variables

```css
/* Text Colors */
--business-text-primary     /* Main text */
--business-text-secondary   /* Secondary text */
--business-text-muted       /* Muted/disabled text */

/* Backgrounds */
--business-surface-1        /* Cards, elevated surfaces */
--business-surface-2        /* Slightly elevated (inputs, code blocks) */
--business-surface-3        /* Hover states */

/* Borders */
--business-border-default   /* Default borders */
--business-border-subtle    /* Subtle dividers */

/* Status Colors */
--business-success          /* Green - completed, verified */
--business-warning          /* Amber - pending, caution */
--business-error            /* Red - errors, cancelled */
--business-info             /* Blue - informational */

/* Brand */
--business-primary-400      /* Primary indigo accent */
--business-primary-500      /* Darker primary */
```

---

## Forbidden Patterns

### Never Use These

```tsx
// FORBIDDEN: Shared UI imports
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Tabs } from '@/components/ui/tabs';

// FORBIDDEN: Tailwind muted classes
className="text-muted-foreground"  // Use: text-[var(--business-text-muted)]
className="bg-muted"               // Use: bg-[var(--business-surface-2)]
className="border-border"          // Use: border-[var(--business-border-default)]

// FORBIDDEN: Inline styles
style={{ fontFamily: 'var(--business-font-display)' }}  // Use CSS classes

// FORBIDDEN: Raw HTML elements for forms
<button>Submit</button>  // Use: <LuxuryButton>
<input />                // Use: <LuxuryInput />
```

---

## Component Library

### Available Components

| Component | Import | Usage |
|-----------|--------|-------|
| `LuxuryCard` | `@/components/business/ui` | Card containers |
| `LuxuryButton` | `@/components/business/ui` | All buttons |
| `LuxuryInput` | `@/components/business/ui` | Text inputs |
| `LuxuryLabel` | `@/components/business/ui` | Form labels |
| `LuxuryDialog` | `@/components/business/ui` | Modal dialogs |
| `LuxuryTabs` | `@/components/business/ui` | Tab navigation |
| `LuxuryCheckbox` | `@/components/business/ui` | Checkboxes |
| `LuxurySwitch` | `@/components/business/ui` | Toggle switches |
| `LuxuryAlert` | `@/components/business/ui` | Alert messages |
| `LuxurySeparator` | `@/components/business/ui` | Dividers |
| `LuxurySkeleton` | `@/components/business/ui` | Loading states |
| `StatusBadge` | `@/components/business/ui` | Status indicators |
| `EmptyState` | `@/components/business/ui` | Empty state UI |
| `HeroStatCard` | `@/components/business/ui` | Large stat cards |
| `ActionCard` | `@/components/business/ui` | Clickable action cards |
| `PageHeader` | `@/components/business/layout` | Page titles |
| `PageContainer` | `@/components/business/layout` | Content wrapper |
| `Section` | `@/components/business/layout` | Content sections |

### Layout Components

```tsx
// Standard page structure
export default function MyPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Page Title"
        description="Page description text"
        actions={<LuxuryButton>Action</LuxuryButton>}
      />

      {/* Stats Grid - 3 columns on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <HeroStatCard ... />
      </div>

      {/* Main Content */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle>Section Title</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent>
          {/* Content */}
        </LuxuryCardContent>
      </LuxuryCard>
    </PageContainer>
  );
}
```

---

## Typography

### Font Families

```css
--business-font-sans: 'Inter', system-ui, sans-serif;
--business-font-display: 'Inter', system-ui, sans-serif;
--business-font-mono: 'JetBrains Mono', monospace;
```

### Text Classes

```tsx
// Headlines
className="business-text-headline"  // 2xl, bold, tracking-tight

// Body text
className="business-text-body"      // Base size, normal weight

// For specific styling
className="text-[var(--business-text-primary)]"    // Primary text
className="text-[var(--business-text-secondary)]"  // Secondary text
className="text-[var(--business-text-muted)]"      // Muted text
```

---

## Responsive Breakpoints

### Standard Grid Patterns

```tsx
// Stats grid: 1 → 2 → 3 columns
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"

// Two-column layout: 1 → 2 columns
className="grid grid-cols-1 lg:grid-cols-2 gap-6"

// Content + sidebar
className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6"

// Action cards: 1 → 2 columns
className="grid grid-cols-1 md:grid-cols-2 gap-4"
```

### Breakpoints

| Breakpoint | Width | Use Case |
|------------|-------|----------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

---

## Animation Guidelines

### Using Motion Components

```tsx
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/business/motion';
import { useReducedMotion } from '@/lib/business/animation/hooks';

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <StaggerContainer>
      <StaggerItem>
        <LuxuryCard>...</LuxuryCard>
      </StaggerItem>
      <StaggerItem>
        <LuxuryCard>...</LuxuryCard>
      </StaggerItem>
    </StaggerContainer>
  );
}
```

### Animation Variants

```tsx
import { staggerContainer, staggerItem, fadeIn } from '@/lib/business/animation/variants';

// Apply to motion.div
<motion.div
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
>
  <motion.div variants={staggerItem}>
    {/* Content */}
  </motion.div>
</motion.div>
```

---

## Forms

### Form Structure

```tsx
// Using react-hook-form with business components
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LuxuryInput, LuxuryButton } from '@/components/business/ui';

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <LuxuryInput placeholder="email@example.com" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <LuxuryButton type="submit">Submit</LuxuryButton>
  </form>
</Form>
```

### Standalone Inputs

```tsx
<div className="space-y-2">
  <LuxuryLabel htmlFor="name">Full Name</LuxuryLabel>
  <LuxuryInput
    id="name"
    placeholder="Enter your name"
    value={value}
    onChange={onChange}
  />
</div>
```

---

## Status Badges

### Variants

```tsx
<StatusBadge variant="success">Completed</StatusBadge>
<StatusBadge variant="warning">Pending</StatusBadge>
<StatusBadge variant="destructive">Cancelled</StatusBadge>
<StatusBadge variant="info">In Progress</StatusBadge>
<StatusBadge variant="default">Draft</StatusBadge>
```

---

## Alerts

### Alert Variants

```tsx
<LuxuryAlert variant="success">
  <CheckCircle className="h-4 w-4" />
  <span>Operation completed successfully</span>
</LuxuryAlert>

<LuxuryAlert variant="error">
  <AlertCircle className="h-4 w-4" />
  <span>An error occurred</span>
</LuxuryAlert>

<LuxuryAlert variant="warning">
  <AlertTriangle className="h-4 w-4" />
  <span>Please review before proceeding</span>
</LuxuryAlert>

<LuxuryAlert variant="info">
  <Info className="h-4 w-4" />
  <span>Additional information</span>
</LuxuryAlert>
```

---

## New Page Checklist

When creating a new business portal page:

- [ ] Use `PageContainer` as the root wrapper
- [ ] Add `PageHeader` with title and description
- [ ] Import only from `@/components/business/ui`
- [ ] Use `--business-*` CSS variables for all colors
- [ ] No inline `style={{ }}` attributes
- [ ] Responsive grid patterns for all layouts
- [ ] Use `LuxuryCard` for all card containers
- [ ] Use `LuxuryButton` for all buttons
- [ ] Use `LuxuryInput` / `LuxuryLabel` for form fields
- [ ] Add animations with `FadeIn` or `StaggerContainer`
- [ ] Test at mobile (375px), tablet (768px), desktop (1280px)

---

## File Organization

```
app/business/
├── (portal)/              # Authenticated portal pages
│   ├── dashboard/
│   │   ├── page.tsx       # Server component (data fetching)
│   │   └── components/
│   │       └── dashboard-content.tsx  # Client component
│   ├── bookings/
│   ├── wallet/
│   └── settings/
├── login/                 # Auth pages (standalone)
├── signup/
├── forgot-password/
├── reset-password/
└── globals.css            # Business design tokens

components/business/
├── ui/                    # All UI components
│   ├── index.ts           # Barrel exports
│   ├── luxury-card.tsx
│   ├── luxury-button.tsx
│   └── ...
├── layout/                # Layout components
│   ├── index.ts
│   ├── page-header.tsx
│   └── page-container.tsx
└── motion/                # Animation components
    ├── index.ts
    └── fade-in.tsx

lib/business/
├── animation/
│   ├── variants.ts        # Framer Motion variants
│   └── hooks.ts           # useReducedMotion, etc.
└── ...
```

---

## Maintenance

### Adding New Components

1. Create in `components/business/ui/`
2. Wrap shadcn/ui base if applicable
3. Apply business design tokens
4. Export from `index.ts`
5. Document usage in this guide

### Updating Design Tokens

1. Edit `app/business/globals.css`
2. Keep `--business-` prefix for all variables
3. Test affected components visually
4. Update this guide if needed

---

*Last updated: December 2025*
