'use client';

/**
 * Business Command Palette
 * Global search and quick actions for the business portal
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
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
  CalendarCheck,
  Wallet,
  Settings,
  Paintbrush,
  Bell,
  Globe,
  Plus,
  CreditCard,
  FileText,
  Search,
  ArrowRight,
} from 'lucide-react';

interface BusinessCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Navigation items for the business portal
const navigationItems = [
  {
    name: 'Dashboard',
    href: '/business/dashboard',
    icon: LayoutDashboard,
    shortcut: 'D',
  },
  {
    name: 'Bookings',
    href: '/business/bookings',
    icon: CalendarCheck,
    shortcut: 'B',
  },
  {
    name: 'Wallet',
    href: '/business/wallet',
    icon: Wallet,
    shortcut: 'W',
  },
  {
    name: 'Settings',
    href: '/business/settings',
    icon: Settings,
    shortcut: 'S',
  },
  {
    name: 'Branding',
    href: '/business/settings/branding',
    icon: Paintbrush,
    shortcut: '',
  },
  {
    name: 'Notifications',
    href: '/business/notifications',
    icon: Bell,
    shortcut: '',
  },
  {
    name: 'Domain',
    href: '/business/domain',
    icon: Globe,
    shortcut: '',
  },
];

// Quick actions
const quickActions = [
  {
    name: 'Create New Booking',
    href: '/business/bookings/new',
    icon: Plus,
    shortcut: 'N',
    description: 'Start a new transfer booking',
  },
  {
    name: 'Add Wallet Credits',
    href: '/business/wallet',
    icon: CreditCard,
    shortcut: '',
    description: 'Add funds to your wallet',
  },
  {
    name: 'View Transactions',
    href: '/business/wallet/transactions',
    icon: FileText,
    shortcut: '',
    description: 'View all wallet transactions',
  },
];

export function BusinessCommandPalette({
  open,
  onOpenChange,
}: BusinessCommandPaletteProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  const runCommand = useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  const navigateTo = useCallback(
    (href: string) => {
      runCommand(() => router.push(href));
    },
    [router, runCommand]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="rounded-lg border-none shadow-2xl">
        <div className="flex items-center border-b border-border px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <CommandInput
            placeholder="Search actions, pages, or bookings..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
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

          {/* Quick Actions */}
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
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{action.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </div>
                {action.shortcut && (
                  <CommandShortcut className="ml-auto">
                    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                      {action.shortcut}
                    </kbd>
                  </CommandShortcut>
                )}
                <ArrowRight className="h-4 w-4 text-muted-foreground/50 ml-auto" />
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator className="my-2" />

          {/* Navigation */}
          <CommandGroup heading="Navigation">
            {navigationItems.map((item) => (
              <CommandItem
                key={item.href}
                value={item.name}
                onSelect={() => navigateTo(item.href)}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg data-[selected=true]:bg-muted"
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

        {/* Footer hint */}
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
      </Command>
    </CommandDialog>
  );
}
