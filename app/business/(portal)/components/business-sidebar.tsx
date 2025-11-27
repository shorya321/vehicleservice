'use client';

/**
 * Business Portal Sidebar Component
 * Collapsible navigation sidebar with nav groups and premium styling
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * Primary: Deep Indigo (#6366F1)
 * Secondary: Teal (#14B8A6)
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  Settings,
  Palette,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getBusinessInitials,
  getContrastColor,
} from '@/lib/business/branding-utils';
import { useSidebar } from '@/components/business/sidebar-context';
import { sidebarCollapse } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  items: SidebarNavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/business/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Management',
    items: [
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
    ],
  },
  {
    title: 'Settings',
    items: [
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
    ],
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
}: BusinessSidebarProps) {
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);
  const { isCollapsed, toggle } = useSidebar();
  const prefersReducedMotion = useReducedMotion();

  // Display values
  const displayName = brandName || businessName;
  const initials = getBusinessInitials(businessName);

  const sidebarWidth = isCollapsed ? 64 : 240;

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={prefersReducedMotion ? undefined : sidebarCollapse}
        style={{
          width: prefersReducedMotion ? sidebarWidth : undefined,
        }}
        className={cn(
          'fixed left-0 top-0 z-40 h-screen',
          'flex flex-col',
          'bg-[var(--business-surface-1)]',
          'border-r border-[var(--business-border-subtle)]',
          'transition-[width] duration-300 ease-out',
          !prefersReducedMotion && 'will-change-[width]'
        )}
      >
        {/* Header with Logo and Toggle */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--business-border-subtle)] px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Logo or Initials */}
            {logoUrl && !logoError ? (
              <div className="relative h-10 w-10 flex-shrink-0 flex items-center justify-center">
                <Image
                  src={logoUrl}
                  alt={`${displayName} logo`}
                  height={40}
                  width={40}
                  className="h-10 w-10 rounded-xl object-cover"
                  unoptimized
                  onError={() => setLogoError(true)}
                  priority={false}
                />
              </div>
            ) : (
              <div
                className={cn(
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                  'bg-[var(--business-primary-500)]/10 text-[var(--business-primary-400)]',
                  'text-sm font-bold'
                )}
              >
                {initials}
              </div>
            )}

            {/* Business Name - Hidden when collapsed */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <h2
                    className="truncate text-sm font-semibold text-[var(--business-text-primary)]"
                    style={{ fontFamily: 'var(--business-font-body)' }}
                  >
                    {displayName}
                  </h2>
                  <p
                    className="text-xs text-[var(--business-text-muted)]"
                    style={{ fontFamily: 'var(--business-font-body)' }}
                  >
                    Business Portal
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={toggle}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              'text-[var(--business-text-muted)] hover:text-[var(--business-text-primary)]',
              'hover:bg-[var(--business-primary-500)]/10',
              'transition-colors duration-200',
              isCollapsed && 'absolute right-2'
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* New Booking CTA */}
        <div className={cn('p-3', isCollapsed && 'px-2')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/business/bookings/new"
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl py-2.5 px-4',
                  'bg-gradient-to-r from-[var(--business-primary-600)] to-[var(--business-primary-500)]',
                  'text-white font-semibold text-sm',
                  'hover:from-[var(--business-primary-500)] hover:to-[var(--business-primary-400)]',
                  'shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]',
                  'hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)]',
                  'transition-all duration-200',
                  isCollapsed && 'px-2'
                )}
                style={{ fontFamily: 'var(--business-font-body)' }}
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      New Booking
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent
                side="right"
                className="bg-[var(--business-surface-3)] text-[var(--business-text-primary)] border-[var(--business-border-default)]"
              >
                New Booking
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto business-scrollbar px-3 pb-4">
          {navGroups.map((group, groupIndex) => (
            <div key={group.title} className={cn(groupIndex > 0 && 'mt-4')}>
              {/* Group Title - Hidden when collapsed */}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="mb-2 px-3 text-[10px] uppercase tracking-wider text-[var(--business-text-muted)] font-semibold"
                    style={{ fontFamily: 'var(--business-font-body)' }}
                  >
                    {group.title}
                  </motion.h3>
                )}
              </AnimatePresence>

              {/* Nav Items */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/business/settings' &&
                      pathname.startsWith(item.href));

                  const navLink = (
                    <Link
                      href={item.href}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5',
                        'text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-[var(--business-primary-500)]/12 text-[var(--business-primary-400)]'
                          : 'text-[var(--business-text-secondary)] hover:bg-[var(--business-primary-500)]/8 hover:text-[var(--business-text-primary)]',
                        isCollapsed && 'justify-center px-2'
                      )}
                      style={{ fontFamily: 'var(--business-font-body)' }}
                    >
                      {/* Active Indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className={cn(
                            'absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full',
                            'bg-gradient-to-b from-[var(--business-primary-500)] to-[var(--business-primary-400)]',
                            'shadow-[0_0_8px_0_rgba(99,102,241,0.4)]'
                          )}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                          }}
                        />
                      )}

                      <Icon
                        className={cn(
                          'h-5 w-5 flex-shrink-0 transition-colors duration-200',
                          isActive
                            ? 'text-[var(--business-primary-400)]'
                            : 'text-[var(--business-text-muted)] group-hover:text-[var(--business-primary-400)]'
                        )}
                      />

                      {/* Item Title - Hidden when collapsed */}
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="whitespace-nowrap overflow-hidden"
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  );

                  // Wrap with tooltip when collapsed
                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="bg-[var(--business-surface-3)] text-[var(--business-text-primary)] border-[var(--business-border-default)]"
                        >
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={item.href}>{navLink}</div>;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer - Version/Help */}
        <div
          className={cn(
            'border-t border-[var(--business-border-subtle)] p-4',
            isCollapsed && 'px-2'
          )}
        >
          <AnimatePresence>
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-[var(--business-text-muted)] text-center"
                style={{ fontFamily: 'var(--business-font-body)' }}
              >
                Business Portal v1.0
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
