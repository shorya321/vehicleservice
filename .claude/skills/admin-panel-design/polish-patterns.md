# Polish Patterns

## Table of Contents
1. [Loading States](#loading-states)
2. [Empty States](#empty-states)
3. [Dark Mode](#dark-mode)
4. [Micro-interactions](#micro-interactions)
5. [Command Palette](#command-palette)
6. [Toasts](#toasts)
7. [Accessibility](#accessibility)

## Loading States

### Skeleton Loading
```tsx
// Card skeleton
<Card className="border-slate-200/50 dark:border-slate-800/50">
  <CardContent className="p-6">
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[140px]" />
        </div>
      </div>
      <Skeleton className="h-[200px] rounded-xl" />
    </div>
  </CardContent>
</Card>

// Table skeleton
<TableRow>
  <TableCell className="pl-6">
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-3 w-[60px]" />
      </div>
    </div>
  </TableCell>
  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
  <TableCell><Skeleton className="h-5 w-[80px] rounded-full" /></TableCell>
  <TableCell className="pr-6 text-right"><Skeleton className="ml-auto h-4 w-[60px]" /></TableCell>
</TableRow>
```

### Button Loading
```tsx
<Button disabled className="min-w-[120px]">
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Saving...
</Button>

// Inline loading indicator
<Button variant="ghost" size="sm" disabled>
  <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
  Refreshing
</Button>
```

### Progress Indicator
```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between text-sm">
    <span className="text-slate-600 dark:text-slate-400">Uploading...</span>
    <span className="font-medium text-slate-900 dark:text-white">67%</span>
  </div>
  <Progress value={67} className="h-2" />
</div>
```

## Empty States

```tsx
// Standard empty state
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
    <Package className="h-8 w-8 text-slate-400" />
  </div>
  <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">
    No items yet
  </h3>
  <p className="mt-2 max-w-sm text-sm text-slate-500">
    Get started by creating your first item. It only takes a moment.
  </p>
  <Button className="mt-6 gap-2">
    <Plus className="h-4 w-4" />
    Create First Item
  </Button>
</div>

// Search empty state
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Search className="h-10 w-10 text-slate-300 dark:text-slate-600" />
  <h3 className="mt-4 text-base font-medium text-slate-900 dark:text-white">
    No results found
  </h3>
  <p className="mt-1 text-sm text-slate-500">
    Try adjusting your search or filters
  </p>
</div>

// Error state
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20">
    <AlertCircle className="h-6 w-6 text-rose-500" />
  </div>
  <h3 className="mt-4 text-base font-medium text-slate-900 dark:text-white">
    Something went wrong
  </h3>
  <p className="mt-1 text-sm text-slate-500">
    We couldn't load the data. Please try again.
  </p>
  <Button variant="outline" className="mt-4 gap-2">
    <RefreshCw className="h-4 w-4" />
    Try Again
  </Button>
</div>
```

## Dark Mode

### Semantic Color Classes
```tsx
// Use these consistently for automatic dark mode support
const theme = {
  // Backgrounds
  bg: "bg-white dark:bg-slate-950",
  bgSubtle: "bg-slate-50 dark:bg-slate-900",
  bgMuted: "bg-slate-100 dark:bg-slate-800",
  
  // Borders
  border: "border-slate-200 dark:border-slate-800",
  borderSubtle: "border-slate-200/50 dark:border-slate-800/50",
  borderMuted: "border-slate-100 dark:border-slate-800/50",
  
  // Text
  text: "text-slate-900 dark:text-slate-100",
  textMuted: "text-slate-600 dark:text-slate-400",
  textSubtle: "text-slate-500 dark:text-slate-500",
  textFaint: "text-slate-400 dark:text-slate-600",
  
  // Interactive
  hover: "hover:bg-slate-50 dark:hover:bg-slate-800/50",
  active: "bg-slate-100 dark:bg-slate-800",
}
```

### Dark Mode Best Practices
```tsx
// Glass effect that works in both modes
<div className="border-slate-200/50 bg-white/80 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/80">

// Reduced contrast in dark mode (not pure white)
<p className="text-slate-900 dark:text-slate-100"> // Not dark:text-white

// Opacity for depth, not color steps
<div className="bg-slate-100 dark:bg-white/5">

// Inverted gradients
<div className="bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-200">
```

## Micro-interactions

### Hover Effects
```tsx
// Card hover
<Card className="transition-all hover:shadow-luxury-lg hover:border-slate-300 dark:hover:border-slate-700">

// Row hover with action reveal
<TableRow className="group">
  <TableCell>
    <Button className="opacity-0 transition-opacity group-hover:opacity-100">
      Edit
    </Button>
  </TableCell>
</TableRow>

// Icon rotation
<Button className="group">
  <ChevronDown className="transition-transform group-hover:rotate-180" />
</Button>
```

### Focus States
```tsx
// Input focus
<Input className="transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800" />

// Button focus
<Button className="focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2">
```

### Transitions
```tsx
// Standard duration
className="transition-all duration-150"

// Smooth ease
className="transition-all duration-200 ease-out"

// Spring-like
className="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
```

## Command Palette

```tsx
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Quick Actions">
      <CommandItem onSelect={() => handleAction('new')}>
        <Plus className="mr-2 h-4 w-4" />
        <span>Create New Item</span>
        <CommandShortcut>⌘N</CommandShortcut>
      </CommandItem>
      <CommandItem onSelect={() => handleAction('search')}>
        <Search className="mr-2 h-4 w-4" />
        <span>Search Everything</span>
        <CommandShortcut>⌘F</CommandShortcut>
      </CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Navigation">
      <CommandItem onSelect={() => navigate('/dashboard')}>
        <LayoutDashboard className="mr-2 h-4 w-4" />
        <span>Dashboard</span>
      </CommandItem>
      <CommandItem onSelect={() => navigate('/settings')}>
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

## Toasts

```tsx
import { toast } from "sonner"

// Success
toast.success("Changes saved", {
  description: "Your updates have been applied successfully.",
})

// Error with action
toast.error("Failed to save", {
  description: "Please check your connection and try again.",
  action: {
    label: "Retry",
    onClick: () => handleRetry(),
  },
})

// Loading promise
toast.promise(saveData(), {
  loading: "Saving changes...",
  success: "Changes saved!",
  error: "Failed to save changes",
})

// Custom with icon
toast("New message received", {
  icon: <MessageCircle className="h-4 w-4" />,
  description: "John sent you a message.",
  action: {
    label: "View",
    onClick: () => openMessage(),
  },
})
```

## Accessibility

### Focus Management
```tsx
// Trap focus in modals
<Dialog>
  <DialogContent>
    {/* Focus automatically trapped */}
  </DialogContent>
</Dialog>

// Skip links
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4">
  Skip to main content
</a>
```

### ARIA Labels
```tsx
// Icon buttons need labels
<Button variant="ghost" size="icon" aria-label="Open menu">
  <Menu className="h-5 w-5" />
</Button>

// Live regions for updates
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>
```

### Color Independence
```tsx
// Never rely on color alone
<Badge className="bg-emerald-50 text-emerald-700">
  <CheckCircle className="mr-1 h-3 w-3" /> {/* Icon + color */}
  Complete
</Badge>
```

### Keyboard Navigation
```tsx
// All interactive elements keyboard accessible
<div 
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  onClick={handleClick}
>
```
