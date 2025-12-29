'use client';

/**
 * Business Portal Sidebar Component
 * Clean sidebar with gold accents using semantic CSS variables
 *
 * Design System: Clean shadcn with Gold Accent
 * Uses bg-card, text-foreground, text-primary for theme-aware colors
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  Settings,
  Palette,
  Plus,
  ChevronLeft,
  X,
  Bell,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBusinessInitials } from '@/lib/business/branding-utils';
import { useSidebar } from '@/components/business/sidebar-context';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: SidebarNavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/business/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: 'Management',
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
    label: 'Settings',
    items: [
      {
        title: 'Branding',
        href: '/business/settings/branding',
        icon: Palette,
      },
      {
        title: 'Notifications',
        href: '/business/settings/notifications',
        icon: Bell,
      },
      {
        title: 'Domain',
        href: '/business/domain',
        icon: Globe,
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

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

function WorkspaceSelector({
  displayName,
  initials,
  logoUrl,
  logoError,
  onLogoError,
  isCollapsed,
  onToggle,
}: {
  displayName: string;
  initials: string;
  logoUrl?: string | null;
  logoError: boolean;
  onLogoError: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative z-10 flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
      <div className={cn(
        'flex items-center gap-3 flex-1 min-w-0 p-2 rounded-xl',
        'hover:bg-primary/10 transition-all duration-200 cursor-pointer'
      )}>
        {logoUrl && !logoError ? (
          <div className="relative h-9 w-9 flex-shrink-0 rounded-xl overflow-hidden ring-2 ring-primary/20">
            <Image
              src={logoUrl}
              alt={`${displayName} logo`}
              height={36}
              width={36}
              className="h-9 w-9 object-cover"
              unoptimized
              onError={onLogoError}
              priority={false}
            />
          </div>
        ) : (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-sm ring-2 ring-primary/20">
            {initials}
          </div>
        )}

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-w-0 overflow-hidden"
            >
              <p className="text-sm font-semibold truncate text-foreground">{displayName}</p>
              <p className="text-xs text-primary">Business Portal</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronLeft className="h-4 w-4" />
        </motion.div>
      </Button>
    </div>
  );
}

function NavItem({
  item,
  isActive,
  isCollapsed,
  onClick,
}: {
  item: SidebarNavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5',
        'text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-primary/10 text-primary shadow-[inset_0_0_30px_rgba(198,170,136,0.08)]'
          : 'text-foreground/70 hover:text-foreground hover:bg-primary/5 hover:shadow-[inset_0_0_20px_rgba(198,170,136,0.05)]',
        isCollapsed && 'justify-center px-2'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebarActiveIndicator"
          className="absolute left-0 inset-y-2 w-1 rounded-r-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}

      <Icon
        className={cn(
          'h-4 w-4 flex-shrink-0 transition-all duration-200',
          'group-hover:scale-110',
          isActive ? 'text-primary' : 'text-foreground/60 group-hover:text-primary'
        )}
      />

      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="whitespace-nowrap overflow-hidden flex-1"
          >
            {item.title}
          </motion.span>
        )}
      </AnimatePresence>

      {item.badge && !isCollapsed && (
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function NewBookingButton({ isCollapsed, onClick }: { isCollapsed: boolean; onClick?: () => void }) {
  return (
    <div className={cn('relative z-10 py-2', isCollapsed ? 'px-2' : 'px-3')}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            className={cn(
              'w-full rounded-xl shadow-sm hover:shadow-glow-gold',
              isCollapsed ? '' : 'gap-2'
            )}
          >
            <Link href="/business/bookings/new" onClick={onClick}>
              <Plus className="h-4 w-4" />
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
          </Button>
        </TooltipTrigger>
        {isCollapsed && <TooltipContent side="right" className="bg-popover border-border text-popover-foreground">New Booking</TooltipContent>}
      </Tooltip>
    </div>
  );
}

export function BusinessSidebar({
  businessName,
  brandName,
  logoUrl,
}: BusinessSidebarProps) {
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);
  const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebar();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const displayName = brandName || businessName;
  const initials = getBusinessInitials(businessName);
  const sidebarWidth = isCollapsed ? 72 : 256;

  useEffect(() => {
    if (isMobile) closeMobile();
  }, [pathname, isMobile, closeMobile]);

  const isPathActive = (href: string) => {
    if (href === '/business/settings') return pathname === href;
    return pathname === href || pathname.startsWith(href);
  };

  const SidebarContent = ({ isMobileView = false }: { isMobileView?: boolean }) => (
    <LayoutGroup>
      {isMobileView ? (
        <div className="relative z-10 flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            {logoUrl && !logoError ? (
              <div className="relative h-9 w-9 flex-shrink-0 rounded-xl overflow-hidden ring-2 ring-primary/20">
                <Image
                  src={logoUrl}
                  alt={`${displayName} logo`}
                  height={36}
                  width={36}
                  className="h-9 w-9 object-cover"
                  unoptimized
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-sm ring-2 ring-primary/20">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{displayName}</p>
              <p className="text-xs text-primary">Business Portal</p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={closeMobile} aria-label="Close menu" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <WorkspaceSelector
          displayName={displayName}
          initials={initials}
          logoUrl={logoUrl}
          logoError={logoError}
          onLogoError={() => setLogoError(true)}
          isCollapsed={isCollapsed}
          onToggle={toggle}
        />
      )}

      <NewBookingButton
        isCollapsed={!isMobileView && isCollapsed}
        onClick={isMobileView ? closeMobile : undefined}
      />

      <ScrollArea className="relative z-10 flex-1 px-3 pb-4">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label} className={cn(groupIndex > 0 && 'mt-6')}>
            <AnimatePresence>
              {(!isCollapsed || isMobileView) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-px bg-gradient-to-r from-primary/60 to-transparent" />
                    <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-primary">
                      {group.label}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = isPathActive(item.href);

                if (!isMobileView && isCollapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <div>
                          <NavItem item={item} isActive={isActive} isCollapsed={true} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-popover border-border text-popover-foreground">{item.title}</TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <NavItem
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    isCollapsed={!isMobileView && isCollapsed}
                    onClick={isMobileView ? closeMobile : undefined}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </ScrollArea>

      <Separator className="bg-primary/10" />
      <div className={cn('relative z-10 p-4', isCollapsed && !isMobileView && 'px-2')}>
        <AnimatePresence>
          {(!isCollapsed || isMobileView) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <span className="text-[10px] text-muted-foreground/70 font-medium tracking-wider">
                v1.0
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );

  if (isMobile) {
    return (
      <Sheet open={isMobileOpen} onOpenChange={(open) => !open && closeMobile()}>
        <SheetContent
          side="left"
          className="w-[280px] p-0 [&>button]:hidden bg-card border-r border-border"
        >
          <div className="relative flex flex-col h-full overflow-hidden">
            <SidebarContent isMobileView />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed left-0 top-0 z-50 h-screen',
          'flex flex-col overflow-hidden',
          'bg-card border-r border-border',
          'shadow-lg sidebar-transition',
          !prefersReducedMotion && 'will-change-[width]'
        )}
      >
        <SidebarContent />
      </motion.aside>
    </TooltipProvider>
  );
}
