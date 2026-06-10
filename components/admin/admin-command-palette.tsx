'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  Car,
  Tag,
  Layers,
  Package,
  Star,
  PenLine,
  FolderOpen,
  MessageSquare,
  MapPin,
  Route,
  Mail,
  Settings,
  Bell,
  Plus,
  UserPlus,
  Search,
  ArrowRight,
} from 'lucide-react';

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigationItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, shortcut: 'D' },
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar, shortcut: 'B' },
  { name: 'Users', href: '/admin/users', icon: Users, shortcut: 'U' },
  { name: 'Vendor Applications', href: '/admin/vendor-applications', icon: Building2, shortcut: '' },
  { name: 'Business Accounts', href: '/admin/businesses', icon: Building2, shortcut: '' },
  { name: 'Vehicles', href: '/admin/vehicles', icon: Car, shortcut: 'V' },
  { name: 'Categories', href: '/admin/vehicle-categories', icon: Tag, shortcut: '' },
  { name: 'Vehicle Types', href: '/admin/vehicle-types', icon: Layers, shortcut: '' },
  { name: 'Addons', href: '/admin/addons', icon: Package, shortcut: '' },
  { name: 'Reviews', href: '/admin/reviews', icon: Star, shortcut: '' },
  { name: 'Blog Posts', href: '/admin/blog/posts', icon: PenLine, shortcut: '' },
  { name: 'Blog Categories', href: '/admin/blog/categories', icon: FolderOpen, shortcut: '' },
  { name: 'Blog Tags', href: '/admin/blog/tags', icon: Tag, shortcut: '' },
  { name: 'Contact Submissions', href: '/admin/contact', icon: MessageSquare, shortcut: '' },
  { name: 'Locations', href: '/admin/locations', icon: MapPin, shortcut: '' },
  { name: 'Routes', href: '/admin/routes', icon: Route, shortcut: '' },
  { name: 'Zones', href: '/admin/zones', icon: MapPin, shortcut: '' },
  { name: 'Emails', href: '/admin/emails', icon: Mail, shortcut: '' },
  { name: 'Settings', href: '/admin/settings', icon: Settings, shortcut: 'S' },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell, shortcut: '' },
];

const quickActions = [
  { name: 'Create New Booking', href: '/admin/bookings', icon: Plus, shortcut: 'N', description: 'Create a new transfer booking' },
  { name: 'Add New User', href: '/admin/users', icon: UserPlus, shortcut: '', description: 'Add a new user account' },
  { name: 'Add New Vehicle', href: '/admin/vehicles', icon: Car, shortcut: '', description: 'Register a new vehicle' },
];

export function AdminCommandPalette({ open, onOpenChange }: AdminCommandPaletteProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        setSearchQuery('');
      }
      onOpenChange(value);
    },
    [onOpenChange]
  );

  const runCommand = useCallback(
    (command: () => void) => {
      handleOpenChange(false);
      command();
    },
    [handleOpenChange]
  );

  const navigateTo = useCallback(
    (href: string) => {
      runCommand(() => router.push(href));
    },
    [router, runCommand]
  );

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Search pages, actions, or settings..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty className="py-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <Search className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No results found for &quot;{searchQuery}&quot;
            </p>
            <p className="text-xs text-muted-foreground/70">
              Try searching for a page or action
            </p>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem
              key={action.href}
              value={action.name}
              onSelect={() => navigateTo(action.href)}
              className="flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <action.icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="font-medium">{action.name}</span>
                <span className="text-xs text-muted-foreground">
                  {action.description}
                </span>
              </div>
              {action.shortcut && (
                <CommandShortcut>
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                    {action.shortcut}
                  </kbd>
                </CommandShortcut>
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator className="my-2" />

        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.name}
              onSelect={() => navigateTo(item.href)}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.name}</span>
              {item.shortcut && (
                <CommandShortcut>
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                    {item.shortcut}
                  </kbd>
                </CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
            ↑↓
          </kbd>
          <span>to navigate</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
            ↵
          </kbd>
          <span>to select</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
            esc
          </kbd>
          <span>to close</span>
        </div>
      </div>
    </CommandDialog>
  );
}
