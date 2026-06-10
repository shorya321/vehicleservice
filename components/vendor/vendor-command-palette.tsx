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
  UserCircle,
  User,
  Car,
  Users,
  Calendar,
  BarChart3,
  Search,
  ArrowRight,
} from 'lucide-react';

interface VendorCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigationItems = [
  { name: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard, shortcut: 'D' },
  { name: 'My Account', href: '/vendor/account', icon: UserCircle, shortcut: '' },
  { name: 'Business Profile', href: '/vendor/profile', icon: User, shortcut: '' },
  { name: 'Vehicles', href: '/vendor/vehicles', icon: Car, shortcut: 'V' },
  { name: 'Drivers', href: '/vendor/drivers', icon: Users, shortcut: '' },
  { name: 'Bookings', href: '/vendor/bookings', icon: Calendar, shortcut: 'B' },
  { name: 'Availability', href: '/vendor/availability', icon: BarChart3, shortcut: '' },
];

const quickActions = [
  { name: 'View Bookings', href: '/vendor/bookings', icon: Calendar, shortcut: 'B', description: 'View and manage your bookings' },
  { name: 'My Vehicles', href: '/vendor/vehicles', icon: Car, shortcut: '', description: 'Manage your vehicle fleet' },
  { name: 'Check Availability', href: '/vendor/availability', icon: BarChart3, shortcut: '', description: 'View and update availability' },
];

export function VendorCommandPalette({ open, onOpenChange }: VendorCommandPaletteProps) {
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
        placeholder="Search pages or actions..."
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
