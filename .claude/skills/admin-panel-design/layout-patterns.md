# Layout Patterns

## Table of Contents
1. [Sidebar](#sidebar)
2. [Header](#header)
3. [Page Structure](#page-structure)
4. [Responsive Layout](#responsive-layout)

## Sidebar

```tsx
<aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200/50 bg-white/80 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/80">
  {/* Logo */}
  <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6 dark:border-slate-800/50">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-200">
      <span className="text-sm font-bold text-white dark:text-slate-900">P</span>
    </div>
    <span className="font-display text-lg font-semibold tracking-tight">Platform</span>
  </div>
  
  {/* Navigation */}
  <nav className="flex flex-col gap-1 p-4">
    {navItems.map((item) => (
      <a
        key={item.href}
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
          isActive 
            ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white" 
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
        )}
      >
        <item.icon className={cn(
          "h-4.5 w-4.5 transition-colors",
          isActive ? "text-slate-700 dark:text-slate-200" : "text-slate-400 group-hover:text-slate-600"
        )} />
        {item.label}
        {item.badge && (
          <Badge variant="secondary" className="ml-auto h-5 rounded-full px-2 text-[10px] font-semibold">
            {item.badge}
          </Badge>
        )}
      </a>
    ))}
  </nav>
  
  {/* Bottom section */}
  <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 p-4 dark:border-slate-800/50">
    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600">
      <Settings className="h-4.5 w-4.5" />
      Settings
    </Button>
  </div>
</aside>
```

## Header

```tsx
<header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/50 bg-white/80 px-6 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/80">
  {/* Breadcrumb */}
  <div className="flex items-center gap-2 text-sm">
    <span className="text-slate-400">Dashboard</span>
    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
    <span className="font-medium text-slate-700 dark:text-slate-200">Analytics</span>
  </div>
  
  {/* Command palette trigger */}
  <button 
    onClick={() => setCommandOpen(true)}
    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900/50"
  >
    <Search className="h-3.5 w-3.5" />
    <span className="hidden sm:inline">Search anything...</span>
    <kbd className="ml-4 hidden rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium sm:inline dark:border-slate-700 dark:bg-slate-800">
      ⌘K
    </kbd>
  </button>
  
  {/* User menu */}
  <div className="flex items-center gap-4">
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-4.5 w-4.5 text-slate-500" />
      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 pl-2 pr-3">
          <Avatar className="h-7 w-7 ring-2 ring-slate-100 dark:ring-slate-800">
            <AvatarImage src="/avatar.jpg" />
            <AvatarFallback className="text-xs">HK</AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">Harry Kumar</p>
          <p className="text-xs text-slate-500">harry@example.com</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
        <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-rose-600">
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</header>
```

## Page Structure

```tsx
// Standard page layout
<div className="flex min-h-screen">
  <Sidebar />
  <div className="flex-1 pl-64">
    <Header />
    <main className="p-6">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your platform performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>
      </div>
      
      {/* Page content */}
      {children}
    </main>
  </div>
</div>
```

## Responsive Layout

```tsx
// Collapsible sidebar for mobile
const [sidebarOpen, setSidebarOpen] = useState(false)

// Mobile sidebar (Sheet)
<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
  <SheetContent side="left" className="w-64 p-0">
    <SidebarContent />
  </SheetContent>
</Sheet>

// Desktop sidebar (always visible)
<aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
  <SidebarContent />
</aside>

// Mobile header with hamburger
<header className="lg:hidden">
  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
    <Menu className="h-5 w-5" />
  </Button>
</header>

// Main content adjusts
<main className="lg:pl-64">
  {children}
</main>
```
