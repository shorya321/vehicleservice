'use client';

/**
 * Business Portal Sidebar Component
 * Navigation sidebar for business users with dynamic branding
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  Settings,
  Globe,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBusinessInitials, getContrastColor, LUXURY_THEME } from '@/lib/business/branding-utils';

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
    title: 'Branding',
    href: '/business/settings/branding',
    icon: Palette,
  },
  {
    title: 'Settings',
    href: '/business/settings',
    icon: Settings,
  },
];

interface BusinessSidebarProps {
  businessName: string;
  brandName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}

export function BusinessSidebar({
  businessName,
  brandName,
  logoUrl,
  primaryColor,
  secondaryColor,
  accentColor,
}: BusinessSidebarProps) {
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);

  // Determine display values with fallbacks to luxury theme
  const displayName = brandName || businessName;
  const bgColor = primaryColor || LUXURY_THEME.background;
  const borderColor = accentColor || LUXURY_THEME.border;
  const activeColor = accentColor || LUXURY_THEME.accent;
  const textColor = getContrastColor(bgColor);
  const initials = getBusinessInitials(businessName);

  return (
    <aside
      style={
        {
          '--brand-bg': bgColor,
          '--brand-border': borderColor,
          '--brand-active': activeColor,
          '--brand-text': textColor,
          backgroundColor: bgColor,
          color: textColor,
        } as React.CSSProperties
      }
      className="fixed left-0 top-0 z-40 h-screen w-64 border-r"
    >
      {/* Business Branding */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        {/* Logo or Initials */}
        {logoUrl && !logoError ? (
          <div className="relative h-10 w-10 flex items-center justify-center">
            <Image
              src={logoUrl}
              alt={`${displayName} logo`}
              height={40}
              width={40}
              className="h-10 w-10 rounded-lg object-cover"
              unoptimized
              onError={() => setLogoError(true)}
              priority={false}
            />
          </div>
        ) : (
          <div
            style={{
              backgroundColor: `${activeColor}1A`, // 10% opacity
              color: activeColor,
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold"
          >
            {initials}
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <h2 className="truncate text-sm font-semibold" style={{ color: textColor }}>
            {displayName}
          </h2>
          <p className="text-xs opacity-70" style={{ color: textColor }}>
            Business Portal
          </p>
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
              style={
                isActive
                  ? {
                      backgroundColor: `${activeColor}1A`, // 10% opacity
                      color: activeColor,
                    }
                  : {}
              }
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'font-semibold' : 'opacity-70 hover:opacity-100'
              )}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = `${activeColor}0D`; // 5% opacity
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
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
