# Business Module Design System

> **Premium Indigo** - A luxury tech aesthetic inspired by Stripe, Linear, and modern SaaS design.

**Version:** 1.0
**Last Updated:** December 2, 2025

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Getting Started](#2-getting-started)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing & Layout](#5-spacing--layout)
6. [UI Components](#6-ui-components)
7. [Animation System](#7-animation-system)
8. [Gradients & Effects](#8-gradients--effects)
9. [Implementation Examples](#9-implementation-examples)

---

## 1. Overview & Philosophy

### Design Principles

The Business Module design system follows a **luxury tech aesthetic** inspired by:

- **Stripe** - Clean, premium interactions with attention to detail
- **Linear** - Modern productivity UI with subtle animations
- **Apple** - Intentional spacing and refined typography
- **Figma** - Professional design tools UX

### Core Principles

1. **Dark Mode First** - Optimized for dark theme, light mode fully supported
2. **Depth Through Elevation** - Multiple surface levels create visual hierarchy
3. **Intentional Color** - Limited palette (Indigo + Teal + Semantic colors)
4. **Refined Animations** - Smooth, purposeful, not flashy
5. **Accessibility** - WCAG compliant contrast ratios, reduced motion support

### File Structure

```
components/business/
├── ui/                    # All UI components
│   ├── index.ts          # Barrel exports
│   ├── luxury-card.tsx
│   ├── luxury-button.tsx
│   └── ...
└── motion/               # Animation components
    ├── fade-in.tsx
    ├── stagger-container.tsx
    └── count-up.tsx

lib/business/
└── animation/
    ├── config.ts         # Timing & easing constants
    ├── variants.ts       # Framer Motion variants
    └── hooks.ts          # Custom animation hooks

app/business/
└── globals.css           # CSS variables & utilities
```

---

## 2. Getting Started

### Importing Components

All business UI components are exported from a single barrel file:

```tsx
import {
  LuxuryCard,
  LuxuryCardHeader,
  LuxuryCardTitle,
  LuxuryCardDescription,
  LuxuryCardContent,
  LuxuryButton,
  LuxuryInput,
  StatusBadge,
  // ... etc
} from '@/components/business/ui';
```

### Basic Page Structure

```tsx
export default function BusinessPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1
          className="text-3xl font-bold text-[var(--business-text-primary)]"
          style={{ fontFamily: 'var(--business-font-display)' }}
        >
          Page Title
        </h1>
        <p className="text-[var(--business-text-muted)]">
          Page description text
        </p>
      </div>

      {/* Content */}
      <LuxuryCard variant="elevated">
        <LuxuryCardHeader>
          <LuxuryCardTitle>Card Title</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent>
          {/* Content here */}
        </LuxuryCardContent>
      </LuxuryCard>
    </div>
  );
}
```

---

## 3. Color System

### Primary Palette (Indigo)

The primary color is Indigo - modern, professional, and inspired by Stripe/Linear.

| Variable | Value | Usage |
|----------|-------|-------|
| `--business-primary-50` | `#EEF2FF` | Lightest backgrounds |
| `--business-primary-100` | `#E0E7FF` | Hover backgrounds |
| `--business-primary-200` | `#C7D2FE` | Light accents |
| `--business-primary-300` | `#A5B4FC` | Secondary accents |
| `--business-primary-400` | `#818CF8` | Icons, highlights |
| `--business-primary-500` | `#6366F1` | **Primary brand color** |
| `--business-primary-600` | `#4F46E5` | Hover states |
| `--business-primary-700` | `#4338CA` | Pressed states |
| `--business-primary` | `#6366F1` | Alias for primary-500 |

### Secondary Palette (Teal)

Fresh accent color for secondary actions and data visualization.

| Variable | Value | Usage |
|----------|-------|-------|
| `--business-secondary-300` | `#5EEAD4` | Light accent |
| `--business-secondary-400` | `#2DD4BF` | Secondary highlights |
| `--business-secondary-500` | `#14B8A6` | Secondary brand |
| `--business-secondary` | `#14B8A6` | Alias |

### Semantic Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--business-success` | `#10B981` | Completed, verified, positive |
| `--business-warning` | `#F59E0B` | Pending, caution |
| `--business-warning-bright` | `#EAB308` | Transitional states |
| `--business-error` | `#EF4444` | Errors, cancelled, negative |
| `--business-info` | `#06B6D4` | Informational |

### Surface Colors (Dark Mode)

Progressive elevation system for visual hierarchy.

| Variable | Value | Usage |
|----------|-------|-------|
| `--business-surface-0` | `#09090B` | Page background |
| `--business-surface-1` | `#0F0F12` | Cards, panels |
| `--business-surface-2` | `#161619` | Inputs, code blocks |
| `--business-surface-3` | `#1C1C21` | Hover states |
| `--business-surface-4` | `#27272A` | Highest elevation |

### Surface Colors (Light Mode)

| Variable | Value | Usage |
|----------|-------|-------|
| `--business-surface-light-0` | `#FFFFFF` | Page background |
| `--business-surface-light-1` | `#F9FAFB` | Cards |
| `--business-surface-light-2` | `#F3F4F6` | Inputs |
| `--business-surface-light-3` | `#E5E7EB` | Hover |
| `--business-surface-light-4` | `#D1D5DB` | Highest |

### Text Colors

**Dark Mode:**
| Variable | Value | Usage |
|----------|-------|-------|
| `--business-text-primary` | `#FAFAFA` | Main text |
| `--business-text-secondary` | `#A1A1AA` | Secondary text |
| `--business-text-muted` | `#52525B` | Disabled, placeholder |

**Light Mode:**
| Variable | Value | Usage |
|----------|-------|-------|
| `--business-text-light-primary` | `#111827` | Main text |
| `--business-text-light-secondary` | `#4B5563` | Secondary |
| `--business-text-light-muted` | `#9CA3AF` | Muted |

### Border Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--business-border-subtle` | `rgba(255,255,255,0.06)` | Dividers |
| `--business-border-default` | `rgba(255,255,255,0.1)` | Standard borders |
| `--business-border-hover` | `rgba(99,102,241,0.4)` | Interactive hover |
| `--business-border-active` | `rgba(99,102,241,0.6)` | Active state |

### Payment Brand Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--business-brand-visa` | `#1A1F71` | Visa cards |
| `--business-brand-mastercard-red` | `#EB001B` | Mastercard |
| `--business-brand-mastercard-orange` | `#F79E1B` | Mastercard |
| `--business-brand-amex` | `#006FCF` | American Express |
| `--business-brand-discover` | `#FF6000` | Discover |

---

## 4. Typography

### Font Families

| Variable | Font | Usage |
|----------|------|-------|
| `--business-font-display` | Plus Jakarta Sans | Headings, titles |
| `--business-font-body` | Inter | Body text, UI |

### Typography Classes

| Class | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `.business-text-display-xl` | 3rem | 3.75rem | Hero sections |
| `.business-text-display-lg` | 2.25rem | 3rem | Page titles |
| `.business-text-headline` | 1.875rem | 2.25rem | Section titles |
| `.business-text-title` | 1.25rem | 1.75rem | Card titles |
| `.business-text-body-lg` | 1.125rem | 1.75rem | Large body |
| `.business-text-body` | 1rem | 1.5rem | Standard body |
| `.business-text-body-sm` | 0.875rem | 1.25rem | Small body |
| `.business-text-caption` | 0.75rem | 1rem | Captions |
| `.business-text-overline` | 0.6875rem | 1rem | Uppercase labels |

### Usage Pattern

```tsx
// Page title
<h1
  className="text-3xl font-bold text-[var(--business-text-primary)]"
  style={{ fontFamily: 'var(--business-font-display)' }}
>
  Dashboard
</h1>

// Body text
<p className="text-[var(--business-text-secondary)]">
  Description text here
</p>

// Muted/helper text
<span className="text-sm text-[var(--business-text-muted)]">
  Helper text
</span>
```

---

## 5. Spacing & Layout

### Spacing Scale

| Variable | Value | Pixels |
|----------|-------|--------|
| `--business-space-0` | 0 | 0px |
| `--business-space-1` | 0.25rem | 4px |
| `--business-space-2` | 0.5rem | 8px |
| `--business-space-3` | 0.75rem | 12px |
| `--business-space-4` | 1rem | 16px |
| `--business-space-5` | 1.25rem | 20px |
| `--business-space-6` | 1.5rem | 24px |
| `--business-space-8` | 2rem | 32px |
| `--business-space-10` | 2.5rem | 40px |
| `--business-space-12` | 3rem | 48px |
| `--business-space-16` | 4rem | 64px |
| `--business-space-20` | 5rem | 80px |
| `--business-space-24` | 6rem | 96px |

### Border Radius

| Variable | Value | Pixels |
|----------|-------|--------|
| `--business-radius-none` | 0 | 0px |
| `--business-radius-sm` | 0.375rem | 6px |
| `--business-radius-md` | 0.5rem | 8px |
| `--business-radius-lg` | 0.75rem | 12px |
| `--business-radius-xl` | 1rem | 16px |
| `--business-radius-2xl` | 1.5rem | 24px |
| `--business-radius-full` | 9999px | Pill |

### Container Widths

| Variable | Value | Usage |
|----------|-------|-------|
| `--business-container-narrow` | 640px | Narrow layouts |
| `--business-container-default` | 1024px | Standard |
| `--business-container-wide` | 1280px | Wide layouts |
| `--business-container-full` | 100% | Full width |

### Z-Index System

| Variable | Value | Usage |
|----------|-------|-------|
| `--business-z-base` | 0 | Default |
| `--business-z-dropdown` | 50 | Dropdowns |
| `--business-z-sticky` | 100 | Sticky headers |
| `--business-z-fixed` | 200 | Fixed elements |
| `--business-z-sidebar` | 250 | Sidebar |
| `--business-z-modal-backdrop` | 300 | Modal backdrop |
| `--business-z-modal` | 400 | Modals |
| `--business-z-popover` | 500 | Popovers |
| `--business-z-tooltip` | 600 | Tooltips |
| `--business-z-toast` | 700 | Toast notifications |

---

## 6. UI Components

### Card Components

#### LuxuryCard

Premium card container with multiple variants.

```tsx
import { LuxuryCard, LuxuryCardHeader, LuxuryCardTitle, LuxuryCardDescription, LuxuryCardContent, LuxuryCardFooter } from '@/components/business/ui';

// Variants
<LuxuryCard variant="default" />    // Standard surface
<LuxuryCard variant="elevated" />   // Raised with shadow
<LuxuryCard variant="hero" />       // Gradient background
<LuxuryCard variant="interactive" /> // Hover effects
<LuxuryCard variant="stat" />       // Compact stat display
<LuxuryCard variant="glass" />      // Glassmorphism
<LuxuryCard variant="gradient" />   // Primary gradient accents

// Sizes
<LuxuryCard size="sm" />     // Small padding
<LuxuryCard size="default" /> // Standard
<LuxuryCard size="lg" />     // Large padding

// With animation
<LuxuryCard animated />
```

#### ActionCard

Quick action cards for dashboard navigation.

```tsx
import { ActionCard, NewBookingAction, WalletAction, ViewBookingsAction, SettingsAction } from '@/components/business/ui';

// Custom
<ActionCard
  title="Create Booking"
  description="Start a new transfer"
  icon={PlusCircle}
  href="/business/bookings/new"
  variant="primary"
/>

// Presets
<NewBookingAction />
<WalletAction />
<ViewBookingsAction />
<SettingsAction />
```

#### HeroStatCard

Large statistics display with animated numbers.

```tsx
import { HeroStatCard } from '@/components/business/ui';

<HeroStatCard
  title="Wallet Balance"
  value={15000}
  format="currency"
  currency="$"
  decimals={2}
  icon={Wallet}
  variant="default"
  trend={{ value: 12, direction: 'up', label: 'vs last month' }}
/>

// Variants: 'default' | 'warning' | 'success' | 'info'
// Formats: 'number' | 'currency' | 'percentage'
```

---

### Button Components

#### LuxuryButton

Premium action buttons with animations.

```tsx
import { LuxuryButton, LuxuryIconButton } from '@/components/business/ui';

// Variants
<LuxuryButton variant="primary">Primary</LuxuryButton>
<LuxuryButton variant="secondary">Secondary</LuxuryButton>
<LuxuryButton variant="ghost">Ghost</LuxuryButton>
<LuxuryButton variant="outline">Outline</LuxuryButton>
<LuxuryButton variant="destructive">Destructive</LuxuryButton>
<LuxuryButton variant="link">Link</LuxuryButton>
<LuxuryButton variant="premium">Premium</LuxuryButton>
<LuxuryButton variant="success">Success</LuxuryButton>

// Sizes
<LuxuryButton size="sm" />      // h-8
<LuxuryButton size="default" /> // h-10
<LuxuryButton size="lg" />      // h-12
<LuxuryButton size="xl" />      // h-14

// With icons
<LuxuryButton leftIcon={<Plus />}>Add Item</LuxuryButton>
<LuxuryButton rightIcon={<ArrowRight />}>Continue</LuxuryButton>

// Loading state
<LuxuryButton isLoading loadingText="Saving...">Save</LuxuryButton>

// Icon button
<LuxuryIconButton size="default"><Settings /></LuxuryIconButton>
```

---

### Form Components

#### LuxuryInput

```tsx
import { LuxuryInput, LuxuryTextarea, LuxuryLabel, LuxuryFormGroup } from '@/components/business/ui';

// Basic input
<LuxuryInput
  placeholder="Enter email"
  variant="default"
  size="default"
/>

// With icons
<LuxuryInput
  leftIcon={<Mail />}
  rightIcon={<Check />}
  placeholder="email@example.com"
/>

// Error state
<LuxuryInput
  isError
  errorMessage="Invalid email address"
/>

// Variants: 'default' | 'filled' | 'ghost'
// Sizes: 'sm' | 'default' | 'lg'

// Textarea
<LuxuryTextarea
  placeholder="Enter description"
  variant="default"
/>

// Form group with label
<LuxuryFormGroup
  label="Email Address"
  required
  hint="We'll never share your email"
  error={errors.email?.message}
>
  <LuxuryInput {...register('email')} />
</LuxuryFormGroup>
```

#### PasswordStrength

```tsx
import { PasswordStrength, RequirementsChecklist } from '@/components/business/ui';

<PasswordStrength password={passwordValue} />

// Strength levels: 'empty' | 'weak' | 'fair' | 'good' | 'strong'

<RequirementsChecklist
  password={password}
  confirmPassword={confirmPassword}
  variant="extended" // or 'default'
/>
```

---

### Select Components

#### LuxurySelect

```tsx
import {
  LuxurySelect,
  LuxurySelectTrigger,
  LuxurySelectContent,
  LuxurySelectItem,
  LuxurySelectValue,
  LuxurySelectLabel,
  LuxurySelectSeparator,
} from '@/components/business/ui';

<LuxurySelect value={value} onValueChange={setValue}>
  <LuxurySelectTrigger className="w-[200px]">
    <LuxurySelectValue placeholder="Select option" />
  </LuxurySelectTrigger>
  <LuxurySelectContent>
    <LuxurySelectLabel>Options</LuxurySelectLabel>
    <LuxurySelectItem value="option1">Option 1</LuxurySelectItem>
    <LuxurySelectItem value="option2">Option 2</LuxurySelectItem>
    <LuxurySelectSeparator />
    <LuxurySelectItem value="option3">Option 3</LuxurySelectItem>
  </LuxurySelectContent>
</LuxurySelect>
```

#### LuxuryDropdownMenu

```tsx
import {
  LuxuryDropdownMenu,
  LuxuryDropdownMenuTrigger,
  LuxuryDropdownMenuContent,
  LuxuryDropdownMenuItem,
  LuxuryDropdownMenuLabel,
  LuxuryDropdownMenuSeparator,
  LuxuryDropdownMenuShortcut,
} from '@/components/business/ui';

<LuxuryDropdownMenu>
  <LuxuryDropdownMenuTrigger asChild>
    <LuxuryButton variant="ghost"><MoreHorizontal /></LuxuryButton>
  </LuxuryDropdownMenuTrigger>
  <LuxuryDropdownMenuContent>
    <LuxuryDropdownMenuLabel>Actions</LuxuryDropdownMenuLabel>
    <LuxuryDropdownMenuItem>
      Edit
      <LuxuryDropdownMenuShortcut>Ctrl+E</LuxuryDropdownMenuShortcut>
    </LuxuryDropdownMenuItem>
    <LuxuryDropdownMenuSeparator />
    <LuxuryDropdownMenuItem className="text-[var(--business-error)]">
      Delete
    </LuxuryDropdownMenuItem>
  </LuxuryDropdownMenuContent>
</LuxuryDropdownMenu>
```

---

### Table Components

#### LuxuryTable

```tsx
import {
  LuxuryTable,
  LuxuryTableHeader,
  LuxuryTableBody,
  LuxuryTableFooter,
  LuxuryTableRow,
  LuxuryTableHead,
  LuxuryTableCell,
  LuxuryTableCaption,
  LuxuryTableEmpty,
} from '@/components/business/ui';

<LuxuryTable scrollable>
  <LuxuryTableHeader>
    <LuxuryTableRow>
      <LuxuryTableHead>Name</LuxuryTableHead>
      <LuxuryTableHead>Status</LuxuryTableHead>
      <LuxuryTableHead className="text-right">Amount</LuxuryTableHead>
    </LuxuryTableRow>
  </LuxuryTableHeader>
  <LuxuryTableBody>
    {items.map((item) => (
      <LuxuryTableRow key={item.id} animated clickable>
        <LuxuryTableCell>{item.name}</LuxuryTableCell>
        <LuxuryTableCell>
          <StatusBadge variant="success">Active</StatusBadge>
        </LuxuryTableCell>
        <LuxuryTableCell className="text-right">
          ${item.amount}
        </LuxuryTableCell>
      </LuxuryTableRow>
    ))}
  </LuxuryTableBody>
</LuxuryTable>

// Empty state
<LuxuryTableEmpty
  icon={Package}
  message="No items found"
  description="Try adjusting your filters"
/>
```

---

### Badge Components

#### StatusBadge

```tsx
import { StatusBadge, BookingStatusBadge, PaymentStatusBadge, AccountStatusBadge } from '@/components/business/ui';

// Generic status badge
<StatusBadge variant="success" size="default">Active</StatusBadge>

// Variants
'default' | 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
'draft' | 'active' | 'inactive' | 'frozen' | 'warning' | 'success' | 'error' | 'info' | 'neutral'
'paid' | 'unpaid' | 'refunded' | 'partially-paid'

// Sizes
'sm' | 'default' | 'lg'

// With pulse animation
<StatusBadge variant="in-progress" pulseDot>Processing</StatusBadge>

// Preset variants
<BookingStatusBadge status="confirmed" />
<PaymentStatusBadge status="paid" />
<AccountStatusBadge status="active" />
```

---

### Dialog Components

#### LuxuryDialog

```tsx
import {
  LuxuryDialog,
  LuxuryDialogTrigger,
  LuxuryDialogContent,
  LuxuryDialogHeader,
  LuxuryDialogFooter,
  LuxuryDialogTitle,
  LuxuryDialogDescription,
  LuxuryDialogClose,
} from '@/components/business/ui';

<LuxuryDialog>
  <LuxuryDialogTrigger asChild>
    <LuxuryButton>Open Dialog</LuxuryButton>
  </LuxuryDialogTrigger>
  <LuxuryDialogContent>
    <LuxuryDialogHeader>
      <LuxuryDialogTitle>Dialog Title</LuxuryDialogTitle>
      <LuxuryDialogDescription>
        Dialog description text here.
      </LuxuryDialogDescription>
    </LuxuryDialogHeader>
    {/* Content */}
    <LuxuryDialogFooter>
      <LuxuryDialogClose asChild>
        <LuxuryButton variant="secondary">Cancel</LuxuryButton>
      </LuxuryDialogClose>
      <LuxuryButton variant="primary">Confirm</LuxuryButton>
    </LuxuryDialogFooter>
  </LuxuryDialogContent>
</LuxuryDialog>
```

#### LuxuryAlertDialog

```tsx
import {
  LuxuryAlertDialog,
  LuxuryAlertDialogTrigger,
  LuxuryAlertDialogContent,
  LuxuryAlertDialogHeader,
  LuxuryAlertDialogFooter,
  LuxuryAlertDialogTitle,
  LuxuryAlertDialogDescription,
  LuxuryAlertDialogAction,
  LuxuryAlertDialogCancel,
} from '@/components/business/ui';

<LuxuryAlertDialog>
  <LuxuryAlertDialogTrigger asChild>
    <LuxuryButton variant="destructive">Delete</LuxuryButton>
  </LuxuryAlertDialogTrigger>
  <LuxuryAlertDialogContent>
    <LuxuryAlertDialogHeader>
      <LuxuryAlertDialogTitle>Are you sure?</LuxuryAlertDialogTitle>
      <LuxuryAlertDialogDescription>
        This action cannot be undone.
      </LuxuryAlertDialogDescription>
    </LuxuryAlertDialogHeader>
    <LuxuryAlertDialogFooter>
      <LuxuryAlertDialogCancel>Cancel</LuxuryAlertDialogCancel>
      <LuxuryAlertDialogAction
        onClick={handleDelete}
        className="bg-[var(--business-error)]"
      >
        Delete
      </LuxuryAlertDialogAction>
    </LuxuryAlertDialogFooter>
  </LuxuryAlertDialogContent>
</LuxuryAlertDialog>
```

---

### Navigation Components

#### LuxuryTabs

```tsx
import {
  LuxuryTabs,
  LuxuryTabsList,
  LuxuryTabsTrigger,
  LuxuryTabsContent,
} from '@/components/business/ui';

<LuxuryTabs defaultValue="tab1">
  <LuxuryTabsList>
    <LuxuryTabsTrigger value="tab1">Tab 1</LuxuryTabsTrigger>
    <LuxuryTabsTrigger value="tab2">Tab 2</LuxuryTabsTrigger>
    <LuxuryTabsTrigger value="tab3">Tab 3</LuxuryTabsTrigger>
  </LuxuryTabsList>
  <LuxuryTabsContent value="tab1">Content 1</LuxuryTabsContent>
  <LuxuryTabsContent value="tab2">Content 2</LuxuryTabsContent>
  <LuxuryTabsContent value="tab3">Content 3</LuxuryTabsContent>
</LuxuryTabs>
```

#### LuxurySeparator

```tsx
import { LuxurySeparator } from '@/components/business/ui';

<LuxurySeparator />                    // Horizontal
<LuxurySeparator orientation="vertical" /> // Vertical
```

---

### Form State Components

#### LuxuryCheckbox

```tsx
import { LuxuryCheckbox } from '@/components/business/ui';

<LuxuryCheckbox
  checked={checked}
  onCheckedChange={setChecked}
  label="Accept terms"
  description="By checking this, you agree to our terms"
/>
```

#### LuxurySwitch

```tsx
import { LuxurySwitch } from '@/components/business/ui';

<LuxurySwitch
  checked={enabled}
  onCheckedChange={setEnabled}
  label="Enable notifications"
  description="Receive email notifications"
/>
```

---

### Utility Components

#### LuxuryAlert

```tsx
import { LuxuryAlert } from '@/components/business/ui';

<LuxuryAlert
  variant="info"
  title="Information"
  description="This is an informational message."
  dismissible
  onDismiss={() => setShow(false)}
/>

// Variants: 'default' | 'info' | 'success' | 'warning' | 'error'
```

#### LuxuryTooltip

```tsx
import {
  LuxuryTooltipProvider,
  LuxuryTooltip,
  LuxuryTooltipTrigger,
  LuxuryTooltipContent,
} from '@/components/business/ui';

<LuxuryTooltipProvider>
  <LuxuryTooltip>
    <LuxuryTooltipTrigger asChild>
      <LuxuryButton variant="ghost"><Info /></LuxuryButton>
    </LuxuryTooltipTrigger>
    <LuxuryTooltipContent>
      Helpful tooltip text
    </LuxuryTooltipContent>
  </LuxuryTooltip>
</LuxuryTooltipProvider>
```

#### EmptyState

```tsx
import { EmptyState } from '@/components/business/ui';

<EmptyState
  icon={Package}
  title="No items found"
  description="Try adjusting your filters"
  variant="default"
  action={<LuxuryButton>Add Item</LuxuryButton>}
/>

// Variants: 'default' | 'primary' | 'muted'
```

#### LuxurySkeleton

```tsx
import {
  LuxurySkeleton,
  LuxurySkeletonText,
  LuxurySkeletonCard,
  LuxurySkeletonTable,
  LuxurySkeletonStatCard,
} from '@/components/business/ui';

<LuxurySkeleton className="h-4 w-full" shimmer />
<LuxurySkeletonText lines={3} />
<LuxurySkeletonCard />
<LuxurySkeletonTable rows={5} columns={4} />
<LuxurySkeletonStatCard />
```

#### ThemeToggle

```tsx
import { ThemeToggle, ThemeToggleWithLabel } from '@/components/business/ui';

<ThemeToggle size="default" />
<ThemeToggleWithLabel />

// Sizes: 'sm' | 'default' | 'lg'
```

---

## 7. Animation System

### Duration Constants

```ts
import { duration } from '@/lib/business/animation/config';

duration.instant   // 0.1s  - Instant feedback
duration.quick     // 0.15s - Quick interactions
duration.base      // 0.25s - Standard (default)
duration.moderate  // 0.35s - Moderate animations
duration.slow      // 0.5s  - Deliberate animations
```

### Easing Curves

```ts
import { easing } from '@/lib/business/animation/config';

easing.easeOut   // [0.4, 0, 0.2, 1]     - Standard deceleration
easing.easeInOut // [0.4, 0, 0.2, 1]     - Smooth
easing.spring    // [0.34, 1.56, 0.64, 1] - Bouncy
easing.smooth    // [0.25, 0.1, 0.25, 1]  - Very smooth
easing.sharp     // [0.4, 0, 0.6, 1]      - Quick
```

### Animation Variants

```ts
import {
  fadeInUp,
  fade,
  scaleIn,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerItem,
  cardHover,
  buttonPress,
  tableRowHover,
  pageTransition,
} from '@/lib/business/animation/variants';

// Usage with motion.div
<motion.div variants={fadeInUp} initial="hidden" animate="visible">
  Content
</motion.div>
```

### Custom Hooks

```tsx
import {
  useReducedMotion,
  useInView,
  useCountUp,
  useStaggerDelay,
  useAnimationState,
} from '@/lib/business/animation/hooks';

// Check reduced motion preference
const prefersReducedMotion = useReducedMotion();

// Viewport detection
const { ref, isInView } = useInView({ once: true });

// Animated counting
const count = useCountUp(1000, { duration: 1500 });

// Stagger delay calculation
const delay = useStaggerDelay(index, 60);
```

### Motion Components

#### FadeIn

```tsx
import { FadeIn, FadeInUp, FadeInScale, FadeInLeft, FadeInRight } from '@/components/business/motion';

<FadeIn type="fadeUp" delay={0.1}>
  <Card>Content</Card>
</FadeIn>

// Or use presets
<FadeInUp delay={0.2}>Content</FadeInUp>
<FadeInScale delay={0.3}>Content</FadeInScale>
```

#### StaggerContainer

```tsx
import { StaggerContainer, StaggerItem, StaggerGrid } from '@/components/business/motion';

// List animation
<StaggerContainer speed="normal">
  {items.map((item, i) => (
    <StaggerItem key={i}>
      <Card>{item}</Card>
    </StaggerItem>
  ))}
</StaggerContainer>

// Grid with built-in responsive layout
<StaggerGrid cols={3} gap="md">
  {items.map((item, i) => (
    <StaggerItem key={i}>
      <Card>{item}</Card>
    </StaggerItem>
  ))}
</StaggerGrid>

// Speeds: 'fast' (0.03s) | 'normal' (0.06s) | 'slow' (0.1s)
// Gaps: 'sm' | 'md' | 'lg'
```

#### CountUp

```tsx
import { CountUp, CurrencyCountUp, PercentageCountUp, CompactCountUp } from '@/components/business/motion';

<CountUp value={1000} duration={1500} />

<CurrencyCountUp value={15000} currency="$" decimals={2} />

<PercentageCountUp value={85} decimals={1} />

<CompactCountUp value={1500000} /> // Outputs: 1.5M
```

---

## 8. Gradients & Effects

### Gradient Variables

```css
/* Primary gradient */
--business-gradient-primary: linear-gradient(135deg, #6366F1 0%, #818CF8 50%, #6366F1 100%);

/* Secondary gradient */
--business-gradient-secondary: linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%);

/* Aurora gradient (multi-color) */
--business-gradient-aurora: linear-gradient(135deg, #6366F1 0%, #14B8A6 50%, #06B6D4 100%);

/* Mesh background */
--business-gradient-mesh: radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
                          radial-gradient(at 80% 0%, rgba(20, 184, 166, 0.08) 0px, transparent 50%),
                          radial-gradient(at 0% 50%, rgba(99, 102, 241, 0.08) 0px, transparent 50%);
```

### Glassmorphism Classes

```tsx
// Light blur
<div className="business-glass-subtle" />

// Medium blur
<div className="business-glass-medium" />

// Strong blur with elevation
<div className="business-glass-elevated" />

// Premium effect with glow
<div className="business-glass-premium" />
```

### Shadow Classes

```tsx
// Elevation shadows
<div className="business-shadow-sm" />
<div className="business-shadow-md" />
<div className="business-shadow-lg" />
<div className="business-shadow-xl" />

// Glow shadows (indigo)
<div className="business-shadow-glow-sm" />
<div className="business-shadow-glow" />
<div className="business-shadow-glow-lg" />

// Combined elevation + glow
<div className="business-shadow-elevated-glow" />
```

---

## 9. Implementation Examples

### Page Header Pattern

```tsx
<div>
  <h1
    className="text-3xl font-bold text-[var(--business-text-primary)]"
    style={{ fontFamily: 'var(--business-font-display)' }}
  >
    Page Title
  </h1>
  <p className="text-[var(--business-text-muted)]">
    Page description explaining what this page does
  </p>
</div>
```

### Dashboard Stats Grid

```tsx
import { StaggerGrid, StaggerItem } from '@/components/business/motion';
import { HeroStatCard } from '@/components/business/ui';

<StaggerGrid cols={4} gap="md">
  <StaggerItem>
    <HeroStatCard
      title="Total Revenue"
      value={125000}
      format="currency"
      icon={DollarSign}
      trend={{ value: 12, direction: 'up', label: 'vs last month' }}
    />
  </StaggerItem>
  <StaggerItem>
    <HeroStatCard
      title="Bookings"
      value={342}
      format="number"
      icon={Calendar}
    />
  </StaggerItem>
  {/* More cards... */}
</StaggerGrid>
```

### Form with Validation

```tsx
import { LuxuryCard, LuxuryCardHeader, LuxuryCardTitle, LuxuryCardContent } from '@/components/business/ui';
import { LuxuryFormGroup, LuxuryInput, LuxuryButton } from '@/components/business/ui';

<LuxuryCard variant="elevated">
  <LuxuryCardHeader>
    <LuxuryCardTitle>Contact Information</LuxuryCardTitle>
  </LuxuryCardHeader>
  <LuxuryCardContent>
    <form className="space-y-4">
      <LuxuryFormGroup
        label="Email"
        required
        error={errors.email?.message}
      >
        <LuxuryInput
          leftIcon={<Mail />}
          placeholder="email@example.com"
          {...register('email')}
          isError={!!errors.email}
        />
      </LuxuryFormGroup>

      <LuxuryFormGroup
        label="Phone"
        hint="Include country code"
      >
        <LuxuryInput
          leftIcon={<Phone />}
          placeholder="+1 (555) 000-0000"
          {...register('phone')}
        />
      </LuxuryFormGroup>

      <LuxuryButton type="submit" isLoading={isSubmitting}>
        Save Changes
      </LuxuryButton>
    </form>
  </LuxuryCardContent>
</LuxuryCard>
```

### Data Table with Actions

```tsx
import {
  LuxuryCard,
  LuxuryTable,
  LuxuryTableHeader,
  LuxuryTableBody,
  LuxuryTableRow,
  LuxuryTableHead,
  LuxuryTableCell,
  StatusBadge,
  LuxuryDropdownMenu,
  LuxuryDropdownMenuTrigger,
  LuxuryDropdownMenuContent,
  LuxuryDropdownMenuItem,
  LuxuryButton,
} from '@/components/business/ui';

<LuxuryCard variant="elevated">
  <LuxuryTable>
    <LuxuryTableHeader>
      <LuxuryTableRow>
        <LuxuryTableHead>Name</LuxuryTableHead>
        <LuxuryTableHead>Status</LuxuryTableHead>
        <LuxuryTableHead>Amount</LuxuryTableHead>
        <LuxuryTableHead className="w-[50px]" />
      </LuxuryTableRow>
    </LuxuryTableHeader>
    <LuxuryTableBody>
      {items.map((item) => (
        <LuxuryTableRow key={item.id} animated>
          <LuxuryTableCell className="font-medium">
            {item.name}
          </LuxuryTableCell>
          <LuxuryTableCell>
            <StatusBadge variant={item.status}>
              {item.statusLabel}
            </StatusBadge>
          </LuxuryTableCell>
          <LuxuryTableCell>
            ${item.amount.toFixed(2)}
          </LuxuryTableCell>
          <LuxuryTableCell>
            <LuxuryDropdownMenu>
              <LuxuryDropdownMenuTrigger asChild>
                <LuxuryButton variant="ghost" size="icon-sm">
                  <MoreHorizontal />
                </LuxuryButton>
              </LuxuryDropdownMenuTrigger>
              <LuxuryDropdownMenuContent>
                <LuxuryDropdownMenuItem>Edit</LuxuryDropdownMenuItem>
                <LuxuryDropdownMenuItem>View</LuxuryDropdownMenuItem>
                <LuxuryDropdownMenuItem className="text-[var(--business-error)]">
                  Delete
                </LuxuryDropdownMenuItem>
              </LuxuryDropdownMenuContent>
            </LuxuryDropdownMenu>
          </LuxuryTableCell>
        </LuxuryTableRow>
      ))}
    </LuxuryTableBody>
  </LuxuryTable>
</LuxuryCard>
```

### Empty State Pattern

```tsx
import { EmptyState, LuxuryButton } from '@/components/business/ui';

<EmptyState
  icon={Package}
  title="No bookings yet"
  description="Create your first booking to get started"
  action={
    <LuxuryButton variant="primary" leftIcon={<Plus />}>
      Create Booking
    </LuxuryButton>
  }
/>
```

### Loading State Pattern

```tsx
import { LuxurySkeletonCard, LuxurySkeletonTable } from '@/components/business/ui';

// Card loading
{isLoading ? (
  <LuxurySkeletonCard />
) : (
  <LuxuryCard>...</LuxuryCard>
)}

// Table loading
{isLoading ? (
  <LuxurySkeletonTable rows={5} columns={4} />
) : (
  <LuxuryTable>...</LuxuryTable>
)}
```

---

## Quick Reference

### Common CSS Variable Usage

```tsx
// Text colors
className="text-[var(--business-text-primary)]"
className="text-[var(--business-text-secondary)]"
className="text-[var(--business-text-muted)]"

// Semantic colors
className="text-[var(--business-success)]"
className="text-[var(--business-error)]"
className="text-[var(--business-warning)]"

// Backgrounds
className="bg-[var(--business-surface-1)]"
className="bg-[var(--business-surface-2)]"

// Borders
className="border border-[var(--business-border-default)]"

// Primary accent
className="text-[var(--business-primary-400)]"
className="bg-[var(--business-primary-500)]"

// Display font
style={{ fontFamily: 'var(--business-font-display)' }}
```

### Component Import Cheatsheet

```tsx
// Most common imports
import {
  // Cards
  LuxuryCard,
  LuxuryCardHeader,
  LuxuryCardTitle,
  LuxuryCardDescription,
  LuxuryCardContent,

  // Buttons
  LuxuryButton,

  // Forms
  LuxuryInput,
  LuxurySelect,
  LuxurySelectTrigger,
  LuxurySelectContent,
  LuxurySelectItem,
  LuxurySelectValue,

  // Tables
  LuxuryTable,
  LuxuryTableHeader,
  LuxuryTableBody,
  LuxuryTableRow,
  LuxuryTableHead,
  LuxuryTableCell,

  // Status
  StatusBadge,

  // Dialogs
  LuxuryAlertDialog,
  LuxuryAlertDialogTrigger,
  LuxuryAlertDialogContent,
  LuxuryAlertDialogHeader,
  LuxuryAlertDialogFooter,
  LuxuryAlertDialogTitle,
  LuxuryAlertDialogDescription,
  LuxuryAlertDialogAction,
  LuxuryAlertDialogCancel,
} from '@/components/business/ui';

// Animation components
import { FadeIn, StaggerContainer, StaggerItem, CountUp } from '@/components/business/motion';

// Animation hooks
import { useReducedMotion, useCountUp } from '@/lib/business/animation/hooks';
```

---

**End of Design System Documentation**
