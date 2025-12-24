---
name: admin-panel-design
description: Create luxury-grade backend admin panels and dashboards with exceptional UX using shadcn/ui and Tailwind CSS. Use when building admin interfaces, CMS backends, analytics dashboards, data management systems, settings pages, or internal tools. Generates production-ready React components with refined aesthetics worthy of premium SaaS products like Linear, Vercel, or Notion.
---

# Admin Panel Design

Create admin interfaces that feel like premium SaaS products. People spend 8+ hours daily in these tools—they deserve exceptional experiences.

## Design Philosophy

Luxury UX means:
- **Reducing cognitive load**: Information hierarchy so clear it feels effortless
- **Respecting user time**: Every click intentional and rewarded
- **Creating delight in utility**: Beautiful = purposeful, not decorative
- **Establishing trust**: Polish signals reliability

## Before Coding

1. **User Context**: Who uses this daily? Skill level? Fears (data loss, mistakes)?
2. **Primary Actions**: What 3 tasks deserve premium treatment?
3. **Information Density**: Traders need density; content editors need space
4. **Aesthetic Direction**: Choose ONE:
   - **Refined Minimal**: Apple-esque restraint, generous whitespace
   - **Sophisticated Dark**: Linear/Bloomberg-inspired, data-forward
   - **Warm Professional**: Notion-like approachability, soft corners
   - **Editorial Clean**: Typography-first, content-focused
   - **Technical Precision**: Vercel/Railway aesthetic, monospace accents

## Core Stack

```tsx
// shadcn/ui imports
import { cn } from "@/lib/utils"
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Label, Badge, Avatar,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Dialog, Sheet, Tabs, Command, Tooltip, Skeleton
} from "@/components/ui"
import { ChevronDown, MoreHorizontal, Plus, Search, Settings } from "lucide-react"
```

## Component Patterns

For detailed component patterns and code examples, see:
- **[references/layout-patterns.md](references/layout-patterns.md)**: Sidebar, header, page structure
- **[references/data-patterns.md](references/data-patterns.md)**: Tables, stats cards, forms
- **[references/polish-patterns.md](references/polish-patterns.md)**: Loading states, empty states, dark mode

## Essential Tailwind Extensions

```js
// tailwind.config.js
{
  extend: {
    boxShadow: {
      'luxury': '0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.04)',
      'luxury-lg': '0 2px 4px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.06)',
    },
    animation: {
      'fade-in': 'fadeIn 0.3s ease-out',
      'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    }
  }
}
```

## Quick Reference

### Spacing System
- Use 4px/8px grid consistently
- Generous padding: `p-6` for cards, `px-4 py-2.5` for nav items
- Sidebar width: `w-64`, Header height: `h-16`

### Typography Scale
- Page title: `text-2xl font-semibold tracking-tight`
- Card title: `text-lg font-semibold`
- Body: `text-sm`, Muted: `text-sm text-slate-500`
- Table header: `text-xs font-medium uppercase tracking-wider`

### Color Tokens
```tsx
// Semantic classes for consistency
const colors = {
  background: "bg-white dark:bg-slate-950",
  backgroundSubtle: "bg-slate-50 dark:bg-slate-900",
  border: "border-slate-200 dark:border-slate-800",
  borderSubtle: "border-slate-200/50 dark:border-slate-800/50",
  text: "text-slate-900 dark:text-slate-100",
  textMuted: "text-slate-500 dark:text-slate-400",
}
```

### Status Badge Colors
```tsx
const statusColors = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  error: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
}
```

## Anti-Patterns

**NEVER**:
- Use generic shadcn defaults without customization
- Create cramped layouts—luxury needs breathing room
- Ignore hover/focus states
- Use harsh shadows (`rgba(0,0,0,0.25)`)
- Skip command palette (⌘K expected in 2025)
- Forget loading and error states

**ALWAYS**:
- Add subtle transitions (150-300ms, ease-out)
- Use consistent iconography (Lucide)
- Implement dark mode with equal care
- Design for the 8-hour workday user

## Checklist Before Shipping

- [ ] Sidebar collapses on mobile
- [ ] Command palette (⌘K) searches everything
- [ ] Tables sort, filter, paginate
- [ ] Forms validate inline
- [ ] Dark mode fully implemented
- [ ] Loading states for async operations
- [ ] Empty states guide action
- [ ] Breadcrumbs provide context
