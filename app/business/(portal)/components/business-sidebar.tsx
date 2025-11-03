'use client';

/**
 * Business Portal Sidebar Component
 * Navigation sidebar for business users
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  Settings,
  Globe,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: SidebarNavItem[] = [
  {
    title: 'Dashboard',
    href: '/business/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Bookings',
    href: '/business/bookings',
    icon: CalendarCheck,
  },
  {
    title: 'Wallet',
    href: '/business/wallet',
    icon: Wallet,
  },
  {
    title: 'Custom Domain',
    href: '/business/domain',
    icon: Globe,
  },
  {
    title: 'Settings',
    href: '/business/settings',
    icon: Settings,
  },
];

interface BusinessSidebarProps {
  businessName: string;
}

export function BusinessSidebar({ businessName }: BusinessSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      {/* Business Branding */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 overflow-hidden">
          <h2 className="truncate text-sm font-semibold">{businessName}</h2>
          <p className="text-xs text-muted-foreground">Business Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
