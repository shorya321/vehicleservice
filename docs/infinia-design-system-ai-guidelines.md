# Infinia Transfers Design System - AI Agent Guidelines

## 🎯 Purpose
This document provides comprehensive design guidelines for AI agents to create UI/UX components that perfectly match the Infinia Transfers design language while incorporating modern UI/UX trends. All implementations must be functional, responsive, accessible, and maintainable.

---

## 🏛️ Design Philosophy

### Core Principles
1. **Luxury & Premium Aesthetic** - Every element should exude sophistication and high-end quality
2. **Dark-First Design** - Optimized for dark mode with elegant contrast
3. **Subtle Sophistication** - Animations and effects enhance rather than distract
4. **Functional Beauty** - Beautiful design that serves user needs efficiently
5. **Accessible Excellence** - Premium experience available to all users
6. **Performance Matters** - Visual richness without compromising speed

### Brand Personality
- **Elegant** - Refined, sophisticated, tasteful
- **Professional** - Reliable, trustworthy, competent
- **Modern** - Contemporary, cutting-edge, innovative
- **Approachable** - User-friendly despite premium positioning

---

## 🎨 Color System

### Primary Palette

```typescript
// Luxury Brand Colors
luxury: {
  gold: "#C6AA88",           // Primary brand color - CTAs, accents, hover states
  goldLight: "#E8D9C5",      // Light variant - subtle highlights
  black: "#0A0A0A",          // Primary background
  darkGray: "#181818",       // Alternate section background
  gray: "#2C2C2C",           // Card backgrounds, UI elements
  lightGray: "#B0B0B0",      // Body text, secondary content
  pearl: "#F5F5F5",          // Headings, primary text
}
```

### Usage Guidelines

**Primary Actions (CTAs):**
```css
background: #C6AA88 (luxury-gold)
text: #0A0A0A (luxury-black)
hover: #C6AA88 with 90% opacity
```

**Secondary Actions:**
```css
border: 2px solid #C6AA88
text: #C6AA88
hover-background: #C6AA88
hover-text: #0A0A0A
```

**Text Hierarchy:**
```css
Headings (h1-h6): #F5F5F5 (luxury-pearl)
Body text: #B0B0B0 (luxury-lightGray)
Muted/helper text: rgba(176, 176, 176, 0.6-0.8)
```

**Backgrounds:**
```css
Primary: #0A0A0A (luxury-black)
Alternate: #181818 (luxury-darkGray)
Cards: rgba(24, 24, 24, 0.8) with backdrop-blur
```

**Borders & Dividers:**
```css
Default: rgba(198, 170, 136, 0.2)
Hover/Active: rgba(198, 170, 136, 0.4)
Focus rings: #C6AA88 solid
```

### Semantic Colors

```typescript
// From Shadcn/Radix system
background: "hsl(var(--background))",
foreground: "hsl(var(--foreground))",
primary: "hsl(var(--primary))",
secondary: "hsl(var(--secondary))",
destructive: "hsl(var(--destructive))",
muted: "hsl(var(--muted))",
accent: "hsl(var(--accent))",
```

**Usage:**
- `background/foreground` - Base app colors
- `primary` - Main brand color (gold)
- `secondary` - Supporting UI elements
- `destructive` - Errors, deletions, warnings
- `muted` - Disabled states, placeholders
- `accent` - Highlights, notifications

---

## ✍️ Typography

### Font Families

```typescript
fontFamily: {
  serif: ["Playfair Display", "serif"],    // Headings, elegant titles
  sans: ["Montserrat", "sans-serif"],      // Body text, UI elements
}
```

### Type Scale

```css
/* Headings */
h1: 2.25rem - 3.75rem (36px - 60px)
   font-family: Playfair Display
   font-weight: 500
   line-height: 1.2
   letter-spacing: -0.025em
   color: #F5F5F5

h2: 1.875rem - 2.25rem (30px - 36px)
   font-family: Playfair Display
   font-weight: 500
   color: #F5F5F5

h3: 1.5rem - 1.875rem (24px - 30px)
   font-family: Playfair Display
   font-weight: 500

h4-h6: 1.125rem - 1.5rem (18px - 24px)
   font-family: Playfair Display
   font-weight: 500

/* Body Text */
body: 1rem (16px)
   font-family: Montserrat
   color: #B0B0B0
   line-height: 1.6

small: 0.875rem (14px)
   font-family: Montserrat
   color: rgba(176, 176, 176, 0.8)

/* UI Elements */
button: 0.875rem (14px)
   font-family: Montserrat
   font-weight: 600
   text-transform: uppercase
   letter-spacing: 0.05em (tracking-wider)
```

### Typography Rules

✅ **DO:**
- Use Playfair Display for ALL headings and titles
- Use Montserrat for body text, buttons, and UI labels
- Maintain tight letter-spacing (-0.025em) on headings
- Use uppercase with wide tracking on buttons
- Apply -webkit-font-smoothing: antialiased

❌ **DON'T:**
- Mix serif fonts in body content
- Use bold weights over 600
- Create custom font stacks without fallbacks
- Ignore responsive font scaling

---

## 🧩 Component Patterns

### Buttons

**Variants:**

```tsx
// Primary (Default)
<Button variant="default">
  className: "bg-luxury-gold text-luxury-black hover:bg-luxury-gold/90
              shadow-md hover:shadow-lg uppercase tracking-wider"
  sizes: sm (h-10 px-4), default (h-12 px-6), lg (h-14 px-8)
</Button>

// Secondary (Outline)
<Button variant="outline">
  className: "border-2 border-luxury-gold text-luxury-gold
              hover:bg-luxury-gold hover:text-luxury-black"
</Button>

// Tertiary (Subtle)
<Button variant="subtle">
  className: "bg-luxury-gray/60 text-luxury-pearl hover:bg-luxury-gray"
</Button>

// Ghost
<Button variant="ghost">
  className: "hover:bg-luxury-gold/10 text-luxury-gold"
</Button>
```

**Implementation Rules:**
- Always use the `Button` component from `@/components/ui/button`
- All button text MUST be uppercase
- Primary actions use `variant="default"`
- Secondary actions use `variant="outline"`
- Icon buttons use `variant="ghost"`
- Disabled state: `disabled:opacity-50 disabled:pointer-events-none`
- Transition: `transition-all duration-300`

### Cards

**Pattern:**

```tsx
<div className="luxury-card luxury-card-hover p-6">
  {/* Card content */}
</div>
```

**Specifications:**
```css
.luxury-card {
  background: rgba(24, 24, 24, 0.8);
  border: 1px solid rgba(198, 170, 136, 0.2);
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);
  transition: all 300ms ease-in-out;
}

.luxury-card-hover:hover {
  transform: translateY(-0.5rem);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
  border-color: rgba(198, 170, 136, 0.4);
}
```

**Usage:**
- Use for all content containers
- Apply `p-6` (1.5rem) padding consistently
- Add `luxury-card-hover` for interactive cards
- Ensure backdrop-blur for glassmorphism effect

### Form Inputs

**Pattern:**

```tsx
<div className="relative w-full">
  <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
        style={{ color: "#C6AA88" }} />
  <Input
    type="text"
    placeholder="Placeholder text"
    className="w-full h-14 bg-transparent border-0 focus:ring-1 pl-12"
    style={{
      color: "#F5F5F5",
      "--tw-ring-color": "#C6AA88"
    }}
  />
</div>
```

**Specifications:**
- Height: `h-14` (3.5rem) for all inputs
- Background: Transparent with parent providing context
- Icon: Always left-aligned with `left-4` positioning
- Padding left: `pl-12` when icon present
- Focus ring: 1px solid `#C6AA88`
- Placeholder: `rgba(198, 170, 136, 0.7)`
- Text color: `#F5F5F5`

### Navigation

**Header Pattern:**

```tsx
<header className="fixed top-0 left-0 right-0 z-50
                   transition-all duration-300
                   bg-luxury-black/80 backdrop-blur-md
                   shadow-xl border-b border-luxury-gold/10">
  <div className="luxury-container">
    <div className="flex items-center justify-between h-20 md:h-24">
      {/* Logo, Nav, Actions */}
    </div>
  </div>
</header>
```

**Rules:**
- Always fixed positioning with `z-50`
- Height: `h-20` mobile, `h-24` desktop
- Transparent/blur background when not scrolled
- Solid background with border when scrolled
- Mobile menu below `lg` breakpoint (1024px)

---

## 🎭 Animation & Motion

### Framer Motion Patterns

**Standard Fade In:**

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
  {children}
</motion.div>
```

**Scroll-Triggered:**

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  viewport={{ once: true }}
>
  {children}
</motion.div>
```

**Staggered Children:**

```tsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      duration: 0.4,
      delay: index * 0.05,
      ease: "easeOut"
    }}
  >
    {item.content}
  </motion.div>
))}
```

**Ambient Animation (Background Elements):**

```tsx
<motion.div
  className="absolute rounded-full w-[600px] h-[600px] bg-amber-500/5"
  initial={{ x: "-20%", y: "-40%" }}
  animate={{
    x: ["-20%", "-15%", "-20%"],
    y: ["-40%", "-45%", "-40%"],
    opacity: [0.02, 0.06, 0.02]
  }}
  transition={{
    duration: 28,
    repeat: Infinity,
    ease: "easeInOut"
  }}
/>
```

### Animation Timing

```typescript
// Standard durations
duration: {
  instant: 0.1,    // Micro-interactions
  fast: 0.2,       // Accordions, toggles
  normal: 0.3,     // Buttons, hover states
  medium: 0.5,     // Fade ins, slides
  slow: 0.8,       // Hero animations
  ambient: 20-30,  // Background animations
}

// Easing functions
easing: {
  easeOut: [0, 0, 0.2, 1],      // Deceleration
  easeIn: [0.4, 0, 1, 1],       // Acceleration
  easeInOut: [0.4, 0, 0.2, 1],  // Smooth both ends
  spring: { stiffness: 80, damping: 20 }  // Bouncy
}
```

### Animation Guidelines

✅ **DO:**
- Use `viewport={{ once: true }}` for scroll animations
- Stagger animations with 50ms (0.05s) delays
- Apply animations to opacity and transform only (GPU-accelerated)
- Use spring animations for interactive elements (modals, drawers)
- Respect user's motion preferences with media queries

❌ **DON'T:**
- Animate layout properties (width, height, top, left)
- Create animations longer than 1 second for UI interactions
- Auto-play animations without user control
- Stack multiple animations on the same element
- Forget exit animations for removed elements

---

## 📱 Responsive Design

### Breakpoints

```typescript
screens: {
  sm: '640px',    // Mobile landscape, small tablets
  md: '768px',    // Tablets
  lg: '1024px',   // Laptop, desktop
  xl: '1280px',   // Large desktop
  '2xl': '1400px' // Extra large screens
}
```

### Mobile-First Approach

**Pattern:**

```tsx
// Base (mobile) → Scale up
<div className="text-sm md:text-base lg:text-lg">
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
<div className="flex-col md:flex-row">
<div className="px-4 sm:px-6 lg:px-8">
```

### Responsive Patterns

**Typography Scaling:**
```css
h1: text-4xl md:text-5xl lg:text-6xl
h2: text-3xl md:text-4xl lg:text-5xl
h3: text-2xl md:text-3xl lg:text-4xl
body: text-sm md:text-base
```

**Spacing Scaling:**
```css
Container padding: px-4 sm:px-6 lg:px-8
Section padding: py-12 sm:py-16 lg:py-20
Gap spacing: gap-4 md:gap-6 lg:gap-8
```

**Grid Columns:**
```css
Mobile: grid-cols-1
Tablet: sm:grid-cols-2
Desktop: lg:grid-cols-3 or lg:grid-cols-4
```

**Navigation:**
```css
Mobile: Hamburger menu (< lg)
Desktop: Horizontal nav (>= lg)
```

### Touch Targets

```typescript
// Minimum sizes for mobile
Button height: h-11 (44px minimum)
Icon buttons: w-11 h-11 (44x44px minimum)
Input height: h-14 (56px for better tap accuracy)
```

---

## 🎯 Spacing & Layout

### Container System

```css
.luxury-container {
  width: 100%;
  max-width: 80rem; /* 1280px */
  margin: 0 auto;
  padding: 0 1rem;    /* Mobile */
}

@media (min-width: 640px) {
  .luxury-container {
    padding: 0 1.5rem;  /* Tablet */
  }
}

@media (min-width: 1024px) {
  .luxury-container {
    padding: 0 2rem;    /* Desktop */
  }
}
```

**Usage:**
- ALL page sections must use `luxury-container`
- Never exceed 80rem (1280px) content width
- Maintains consistent horizontal padding across breakpoints

### Section Spacing

```css
.section-padding {
  padding-top: 5rem;      /* Mobile: 80px */
  padding-bottom: 5rem;
}

@media (min-width: 640px) {
  .section-padding {
    padding-top: 6rem;    /* Tablet: 96px */
    padding-bottom: 6rem;
  }
}

@media (min-width: 1024px) {
  .section-padding {
    padding-top: 7rem;    /* Desktop: 112px */
    padding-bottom: 7rem;
  }
}
```

### Spacing Scale

```typescript
// Tailwind spacing (use these values)
spacing: {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
}

// Common usage
gap: 'gap-8',              // Grid/flex gaps
padding: 'p-6',            // Card padding
margin-bottom: 'mb-4',     // Element separation
```

### Border Radius

```typescript
borderRadius: {
  sm: 'calc(var(--radius) - 4px)',  // Small elements
  md: 'calc(var(--radius) - 2px)',  // Default
  lg: 'var(--radius)',               // Cards
  full: '9999px',                    // Pills, circles
}

// --radius default: 0.5rem (8px)
```

---

## ✨ Visual Effects

### Glassmorphism

**Implementation:**

```css
/* Standard Glass Effect */
.glass-effect {
  background: rgba(24, 24, 24, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(198, 170, 136, 0.2);
}

/* Prominent Glass Effect */
.glass-gold {
  background: rgba(24, 24, 24, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(198, 170, 136, 0.3);
  box-shadow: 0 10px 20px rgba(198, 170, 136, 0.1);
}
```

**Usage Rules:**
- Use on overlays, modals, cards on images
- Always include webkit prefix for Safari
- Combine with semi-transparent backgrounds
- Add subtle border for definition

### Shadows

```typescript
boxShadow: {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
  gold: '0 10px 20px -5px rgba(198, 170, 136, 0.15)',
}
```

**Hierarchy:**
- Default: `shadow-lg` for cards
- Elevated: `shadow-xl` for modals, dropdowns
- Focus: `shadow-2xl` for emphasized elements
- Premium: `shadow-gold` for CTAs and premium features

### Hover States

**Standard Pattern:**

```tsx
<div className="transition-all duration-300
                hover:transform hover:-translate-y-2
                hover:shadow-2xl
                hover:border-luxury-gold/40">
  {content}
</div>
```

**Button Hover:**
```css
/* Default button */
background: #C6AA88
hover-background: rgba(198, 170, 136, 0.9)
hover-shadow: shadow-lg

/* Outline button */
border: 2px solid #C6AA88
hover-background: #C6AA88
hover-text: #0A0A0A
```

### Focus States

```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-luxury-gold
focus-visible:ring-offset-2
focus-visible:ring-offset-luxury-black
```

**Rules:**
- Use `focus-visible` instead of `focus`
- Ring width: 2px
- Ring offset: 2px for better visibility
- Ring color: Always gold (#C6AA88)

---

## 🎨 Latest UI/UX Trends Integration

### 1. Glassmorphism (2024 Standard)

**When to Use:**
- Cards over images or gradient backgrounds
- Navigation overlays
- Modal dialogs and popovers
- Hero sections with background imagery

**Implementation:**
```tsx
<div className="relative overflow-hidden">
  <Image src="/hero.jpg" alt="Background" fill className="object-cover opacity-50" />
  <div className="relative z-10 backdrop-blur-md bg-luxury-darkGray/70
                  border border-luxury-gold/20 rounded-lg p-6">
    {content}
  </div>
</div>
```

### 2. Micro-interactions

**Examples:**
- Button scale on press: `active:scale-95`
- Icon rotation on hover: `hover:rotate-180 transition-transform`
- Text reveal on hover: `group-hover:opacity-100`
- Progress indicators during loading

**Pattern:**
```tsx
<button className="transition-all duration-200
                   hover:scale-105 active:scale-95
                   hover:shadow-lg">
  <Icon className="transition-transform duration-300
                   group-hover:rotate-12" />
  {label}
</button>
```

### 3. Skeleton Loading

**Pattern:**

```tsx
import { Skeleton } from "@/components/ui/skeleton"

<div className="luxury-card p-6">
  <Skeleton className="h-48 w-full mb-4" />
  <Skeleton className="h-4 w-3/4 mb-2" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

### 4. Progressive Disclosure

**Examples:**
- Accordion for FAQs
- Expandable sections
- "Show more" buttons
- Tabbed interfaces

**Pattern:**
```tsx
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Question</AccordionTrigger>
    <AccordionContent>Answer content...</AccordionContent>
  </AccordionItem>
</Accordion>
```

### 5. Ambient Animations

**Background Movement:**
```tsx
<div className="absolute inset-0 overflow-hidden -z-10">
  <motion.div
    className="absolute rounded-full w-96 h-96 bg-luxury-gold/5"
    animate={{
      x: [0, 100, 0],
      y: [0, -100, 0],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 25,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
</div>
```

### 6. Card-Based Layouts

**Modern Grid:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {items.map((item) => (
    <motion.div
      key={item.id}
      className="luxury-card luxury-card-hover p-6"
      whileHover={{ y: -8 }}
    >
      {item.content}
    </motion.div>
  ))}
</div>
```

### 7. Scroll-Triggered Animations

**Fade-in on Scroll:**
```tsx
<motion.section
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6 }}
>
  {content}
</motion.section>
```

### 8. Toast Notifications

**Pattern:**
```tsx
import { toast } from "sonner"

// Success
toast.success("Booking confirmed!", {
  description: "You will receive an email shortly.",
})

// Error
toast.error("Something went wrong", {
  description: "Please try again later.",
})
```

---

## ♿ Accessibility Requirements

### WCAG AA Compliance

**Color Contrast:**
```typescript
// Minimum contrast ratios
Normal text: 4.5:1
Large text (18px+): 3:1
UI components: 3:1

// Our palette compliance
#F5F5F5 on #0A0A0A: ✅ 17.8:1 (AAA)
#C6AA88 on #0A0A0A: ✅ 8.2:1 (AAA)
#B0B0B0 on #0A0A0A: ✅ 9.5:1 (AAA)
```

### Keyboard Navigation

**Requirements:**
- All interactive elements must be keyboard accessible
- Focus indicators must be visible (ring-2)
- Tab order must be logical (DOM order)
- Escape key closes modals/dropdowns
- Enter/Space activates buttons

**Implementation:**
```tsx
<button
  className="focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-luxury-gold focus-visible:ring-offset-2"
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  {label}
</button>
```

### Semantic HTML

```tsx
// ✅ DO: Use semantic elements
<header>, <nav>, <main>, <section>, <article>, <footer>
<h1> through <h6> in hierarchical order
<button> for actions, <a> for navigation

// ❌ DON'T: Use div for everything
<div onClick={...}> // Use <button> instead
<span onClick={...}> // Use <button> or <a>
```

### ARIA Attributes

**When Required:**
```tsx
// Icon-only buttons
<button aria-label="Close dialog">
  <X className="w-5 h-5" />
</button>

// Loading states
<button aria-busy="true" aria-label="Loading...">
  <Spinner />
</button>

// Expanded/collapsed states
<button aria-expanded={isOpen}>Toggle menu</button>

// Hidden decorative elements
<div aria-hidden="true">decorative icon</div>
```

### Screen Reader Support

**Best Practices:**
- Alt text on all images (describe content, not "image of")
- Skip to main content link
- Landmark regions defined
- Form labels properly associated
- Error messages announced
- Loading states communicated

---

## ⚡ Performance Optimization

### Image Optimization

**Next.js Image Component:**

```tsx
import Image from "next/image"

// Hero images (above fold)
<Image
  src="/hero.jpg"
  alt="Descriptive alt text"
  fill
  priority
  className="object-cover"
  sizes="100vw"
/>

// Below fold images
<Image
  src="/card-image.jpg"
  alt="Descriptive alt text"
  width={400}
  height={300}
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**Rules:**
- Always use Next.js Image component
- Provide `priority` for above-fold images
- Use `fill` with proper sizing for responsive images
- Define `sizes` attribute for better performance
- Use WebP format when possible

### Animation Performance

**GPU-Accelerated Properties:**
```typescript
// ✅ Animate these (hardware accelerated)
transform: translate, scale, rotate
opacity
filter: blur, brightness

// ❌ Avoid animating these (causes reflow)
width, height, top, left, margin, padding
```

**Optimization Pattern:**
```tsx
// Use transform instead of position
<motion.div
  animate={{ x: 100 }}  // ✅ GPU accelerated
  // NOT: animate={{ left: 100 }}  // ❌ Causes reflow
/>

// Use opacity instead of visibility
<motion.div
  animate={{ opacity: 0 }}  // ✅ GPU accelerated
  // NOT: animate={{ display: 'none' }}  // ❌ Not animatable
/>
```

### Bundle Optimization

**Component Imports:**
```tsx
// ✅ Import only what you need
import { Button } from "@/components/ui/button"
import { MapPin, Calendar } from "lucide-react"

// ❌ Don't import entire libraries
import * as Icons from "lucide-react"
```

**Dynamic Imports:**
```tsx
// For heavy components
const HeavyComponent = dynamic(
  () => import("@/components/heavy-component"),
  { loading: () => <Skeleton /> }
)
```

### Runtime Performance

**Optimization Checklist:**
- Use React.memo for expensive components
- Implement proper key props in lists
- Avoid inline function definitions in renders
- Use useCallback for event handlers
- Debounce search inputs and scrolls
- Virtualize long lists (react-window)

---

## 🛠️ Technical Implementation

### Required Dependencies

```json
{
  "dependencies": {
    "@radix-ui/react-*": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "framer-motion": "latest",
    "lucide-react": "latest",
    "next": "latest",
    "react": "latest",
    "tailwind-merge": "latest",
    "tailwindcss": "latest",
    "tailwindcss-animate": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "typescript": "latest"
  }
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          gold: "#C6AA88",
          goldLight: "#E8D9C5",
          black: "#0A0A0A",
          darkGray: "#181818",
          gray: "#2C2C2C",
          lightGray: "#B0B0B0",
          pearl: "#F5F5F5",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-montserrat)", "sans-serif"],
      },
      boxShadow: {
        gold: "0 10px 20px -5px rgba(198, 170, 136, 0.15)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "fade-in-bottom": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "fade-in-bottom": "fade-in-bottom 0.6s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
```

### TypeScript Patterns

**Component Props:**

```typescript
import { type VariantProps } from "class-variance-authority"

// Define variants
const cardVariants = cva("luxury-card", {
  variants: {
    variant: {
      default: "bg-luxury-darkGray/80",
      elevated: "bg-luxury-darkGray/90 shadow-xl",
    },
    hover: {
      true: "luxury-card-hover",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    hover: false,
  },
})

// Component interface
interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode
}

// Component implementation
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, hover }), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"
```

### Utility Functions

**cn() - Class Merger:**

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)} />
```

### File Organization

```
components/
├── ui/                       # Shadcn UI components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── layout/                   # Layout components
│   ├── header.tsx
│   ├── footer.tsx
│   └── sidebar.tsx
├── home/                     # Feature-specific
│   ├── hero.tsx
│   ├── testimonials.tsx
│   └── ...
└── [feature]/               # Other features
    └── ...

app/
├── (auth)/                  # Route groups
├── (dashboard)/
└── page.tsx                 # Routes

lib/
├── utils.ts                 # Utilities
├── constants.ts             # Constants
└── types.ts                 # Shared types
```

---

## ✅ DO's and ❌ DON'Ts

### Component Development

✅ **DO:**
- Use Shadcn UI and Radix primitives for all UI components
- Implement TypeScript interfaces for all props
- Use `cn()` utility for className merging
- Forward refs for proper composition
- Export displayName for debugging
- Use variants with CVA for component flexibility
- Keep components under 200 lines

❌ **DON'T:**
- Create custom implementations of accessible components
- Use `any` type
- Inline styles without theme variables
- Create components without TypeScript
- Forget error boundaries
- Mix business logic with presentation

### Styling

✅ **DO:**
- Use Tailwind utility classes exclusively
- Follow the luxury color palette exactly
- Use semantic color names (primary, secondary, etc.)
- Apply responsive modifiers (sm:, md:, lg:)
- Use theme variables for consistency
- Extract repeated patterns to components

❌ **DON'T:**
- Write custom CSS unless absolutely necessary
- Use arbitrary values frequently ([#ff0000])
- Create color values outside the palette
- Use inline styles for theme values
- Ignore responsive design
- Use !important

### Animation

✅ **DO:**
- Use Framer Motion for complex animations
- Apply `viewport={{ once: true }}` for scroll animations
- Animate transform and opacity only
- Use easeOut for entrances, easeIn for exits
- Stagger children animations by 50ms
- Respect user motion preferences

❌ **DON'T:**
- Animate layout properties
- Create animations over 1 second for UI
- Auto-play without user control
- Nest multiple animation libraries
- Forget loading states
- Overuse motion effects

### Accessibility

✅ **DO:**
- Use semantic HTML elements
- Provide alt text for images
- Include aria-labels for icon buttons
- Implement keyboard navigation
- Ensure focus visibility
- Test with screen readers
- Maintain 4.5:1 contrast minimum

❌ **DON'T:**
- Use divs for buttons
- Forget alt attributes
- Remove focus indicators
- Break tab order
- Use color alone to convey information
- Ignore ARIA when needed

### Performance

✅ **DO:**
- Use Next.js Image component
- Implement lazy loading
- Code-split heavy components
- Optimize images (WebP)
- Use proper React keys
- Memoize expensive computations
- Debounce inputs

❌ **DON'T:**
- Load all images eagerly
- Bundle everything together
- Create unnecessary re-renders
- Use large unoptimized images
- Ignore bundle size
- Animate expensive properties

---

## 📋 Component Checklist

Before completing any component, verify:

### Visual Design
- [ ] Matches luxury aesthetic (dark theme, gold accents)
- [ ] Uses correct color palette
- [ ] Typography follows system (Playfair/Montserrat)
- [ ] Spacing is consistent with design system
- [ ] Glassmorphism applied where appropriate
- [ ] Shadows match hierarchy

### Responsiveness
- [ ] Works on mobile (320px+)
- [ ] Works on tablet (768px+)
- [ ] Works on desktop (1024px+)
- [ ] Touch targets minimum 44px
- [ ] Text scales appropriately
- [ ] Images responsive
- [ ] No horizontal scroll

### Accessibility
- [ ] Semantic HTML used
- [ ] Keyboard navigable
- [ ] Focus indicators visible
- [ ] ARIA labels where needed
- [ ] Color contrast WCAG AA
- [ ] Screen reader tested
- [ ] Error messages clear

### Performance
- [ ] Images optimized
- [ ] Animations GPU-accelerated
- [ ] No layout shifts (CLS)
- [ ] Fast loading (LCP < 2.5s)
- [ ] Minimal re-renders
- [ ] Bundle size reasonable

### Code Quality
- [ ] TypeScript types defined
- [ ] Component props documented
- [ ] Error handling implemented
- [ ] Loading states included
- [ ] Reusable and composable
- [ ] No console errors
- [ ] Follows naming conventions

### Functionality
- [ ] All interactions work
- [ ] Forms validate properly
- [ ] Error states handled
- [ ] Success states shown
- [ ] Edge cases covered
- [ ] Cross-browser tested

---

## 🎓 Examples & Templates

### Page Template

```tsx
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function PageName() {
  return (
    <main className="bg-luxury-black">
      <Header />

      {/* Hero Section */}
      <section className="section-padding bg-luxury-black">
        <div className="luxury-container">
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-center mb-4">
            Page Title
          </h1>
          <p className="text-lg text-center text-luxury-lightGray max-w-2xl mx-auto">
            Page description
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="section-padding bg-luxury-darkGray">
        <div className="luxury-container">
          <div className="section-title-wrapper">
            <h2 className="section-title">Section Title</h2>
            <div className="section-divider"></div>
            <p className="section-subtitle">Section description</p>
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Cards */}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
```

### Card Component Template

```tsx
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Icon } from "lucide-react"

interface CardProps {
  title: string
  description: string
  image?: string
  action?: () => void
}

export function Card({ title, description, image, action }: CardProps) {
  return (
    <motion.div
      className="luxury-card luxury-card-hover p-6 flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {image && (
        <div className="relative w-full aspect-video mb-5 rounded-md overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      )}

      <h3 className="text-xl font-serif text-luxury-pearl mb-3">
        {title}
      </h3>

      <p className="text-luxury-lightGray mb-6 flex-grow">
        {description}
      </p>

      {action && (
        <Button
          variant="default"
          onClick={action}
          className="w-full mt-auto"
        >
          <Icon className="w-4 h-4 mr-2" />
          Action
        </Button>
      )}
    </motion.div>
  )
}
```

### Form Template

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Calendar } from "lucide-react"

export function SearchForm() {
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    date: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full p-3 rounded-xl backdrop-blur-lg border
                 bg-luxury-darkGray/50 border-luxury-gold/20"
    >
      <div className="flex flex-col md:flex-row items-center gap-2">
        {/* From Input */}
        <div className="relative w-full flex-grow">
          <MapPin
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: "#C6AA88" }}
          />
          <Input
            type="text"
            placeholder="From (airport, port, address)"
            value={formData.from}
            onChange={(e) => setFormData({ ...formData, from: e.target.value })}
            className="w-full h-14 bg-transparent border-0 focus:ring-1 pl-12"
            style={{
              color: "#F5F5F5",
              "--tw-ring-color": "#C6AA88"
            } as React.CSSProperties}
          />
        </div>

        {/* Divider */}
        <div className="hidden md:block border-l h-8 mx-1 border-luxury-gold/20" />

        {/* To Input */}
        <div className="relative w-full flex-grow">
          <MapPin
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: "#C6AA88" }}
          />
          <Input
            type="text"
            placeholder="To (airport, port, address)"
            value={formData.to}
            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            className="w-full h-14 bg-transparent border-0 focus:ring-1 pl-12"
            style={{
              color: "#F5F5F5",
              "--tw-ring-color": "#C6AA88"
            } as React.CSSProperties}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="default"
          size="default"
          className="w-full md:w-auto h-14 ml-0 md:ml-1"
        >
          Search
        </Button>
      </div>
    </form>
  )
}
```

---

## 🚀 Quick Start Guide

### Creating a New Component

1. **Choose the right base:**
   - Interactive element? Use Radix/Shadcn primitive
   - Custom component? Start with semantic HTML
   - Layout? Use section/div with luxury-container

2. **Set up structure:**
   ```tsx
   "use client" // If client-side interactivity needed

   import { motion } from "framer-motion"
   import { Icon } from "lucide-react"
   // Other imports

   interface ComponentProps {
     // Define props
   }

   export function Component({ props }: ComponentProps) {
     return (
       <motion.div
         className="luxury-card p-6"
         initial={{ opacity: 0, y: 20 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
       >
         {/* Component content */}
       </motion.div>
     )
   }
   ```

3. **Apply styling:**
   - Use utility classes from design system
   - Follow responsive patterns
   - Add hover/focus states
   - Ensure accessibility

4. **Add animations:**
   - Scroll-triggered fade in
   - Hover effects
   - Loading states
   - Transitions

5. **Test:**
   - Responsive behavior
   - Keyboard navigation
   - Screen reader
   - Performance

### Decision Tree

**Q: Does this component exist in Shadcn?**
- YES → Use Shadcn component, customize with variants
- NO → Continue

**Q: Does this need accessibility features (tabs, accordion, dialog)?**
- YES → Use Radix primitive, style with Tailwind
- NO → Continue

**Q: Is this a layout component?**
- YES → Use semantic HTML + luxury-container
- NO → Continue

**Q: Is this a card or container?**
- YES → Use luxury-card classes
- NO → Build custom with Tailwind utilities

---

## 📚 Resources

### Documentation Links
- [Radix UI Docs](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [Shadcn UI Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Design Inspiration
- Luxury travel websites (high-end aesthetic)
- Premium SaaS products (modern UI patterns)
- Award-winning portfolios (interaction design)

---

## 🎯 Summary

When building components for Infinia Transfers, remember:

1. **Luxury First** - Every pixel should feel premium
2. **Radix + Shadcn + Tailwind** - Never reinvent accessible components
3. **Mobile First** - Design for smallest screen, scale up
4. **Accessibility Always** - WCAG AA compliance non-negotiable
5. **Performance Matters** - Beautiful AND fast
6. **Type Safety** - TypeScript for all component props
7. **Consistent Patterns** - Follow established conventions
8. **Modern Trends** - Glassmorphism, micro-interactions, smooth animations
9. **Test Thoroughly** - Responsive, accessible, performant
10. **Document Well** - Clear prop interfaces and usage examples

This design system ensures every component you create maintains the luxury aesthetic, follows modern best practices, works beautifully across all devices, remains accessible to all users, and performs exceptionally well.

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
**Maintained by:** Development Team