'use client';

/**
 * Business Portal Header Component
 * Clean header with gold accents using semantic CSS variables
 *
 * Design System: Clean shadcn with Gold Accent
 * Uses bg-card, text-foreground, text-primary for theme-aware colors
 */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LogOut,
  Settings,
  Palette,
  ChevronDown,
  Menu,
  Globe,
  Wallet,
  Search,
} from 'lucide-react';
import { BusinessCommandPalette } from './business-command-palette';
import { useCommandPalette } from '@/lib/business/command-palette/use-command-palette';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { BusinessNotificationBell } from '@/components/business/notifications/notification-bell';
import { ThemeToggle } from '@/components/business/ui/theme-toggle';
import { useSidebar } from '@/components/business/sidebar-context';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { cn } from '@/lib/utils';

interface BusinessHeaderProps {
  // User info
  userEmail: string;
  contactPersonName: string | null;

  // Branding props
  businessName: string;
  brandName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
}

export function BusinessHeader({
  userEmail,
  contactPersonName,
  businessName,
  brandName,
}: BusinessHeaderProps) {
  const router = useRouter();
  const { isCollapsed, openMobile } = useSidebar();
  const prefersReducedMotion = useReducedMotion();
  const { isOpen: commandOpen, setIsOpen: setCommandOpen } = useCommandPalette();

  // Sidebar widths - match sidebar component (desktop only)
  const expandedWidth = 260;
  const collapsedWidth = 72;
  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;

  // Display values
  const displayName = brandName || businessName;
  const displayPersonName = contactPersonName || 'User';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  async function handleLogout() {
    try {
      const response = await fetch('/api/business/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      toast.success('Logged out', {
        description: 'You have been successfully logged out.',
      });

      router.push('/business/login');
      router.refresh();
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to log out. Please try again.',
      });
    }
  }

  return (
    <motion.header
      initial={false}
      animate={{ left: currentWidth }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 300, damping: 30 }
      }
      style={{ left: prefersReducedMotion ? currentWidth : undefined }}
      className={cn(
        'fixed top-0 right-0 z-30 flex h-14 items-center justify-between',
        'bg-card/95 backdrop-blur-sm',
        'border-b border-border',
        'shadow-sm',
        'px-4 md:px-6',
        'max-md:!left-0'
      )}
    >
      {/* Left side - Mobile menu toggle + Search */}
      <div className="relative z-10 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={openMobile}
          className="md:hidden text-muted-foreground hover:text-primary hover:bg-primary/10"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Command Palette Trigger */}
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:border-primary/30"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="ml-2 hidden md:inline rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side - Theme Toggle, Notifications and User Dropdown */}
      <div className="relative z-10 flex items-center gap-1">
        {/* Theme Toggle */}
        <ThemeToggle size="default" />

        {/* Notification Bell */}
        <BusinessNotificationBell />

        {/* User Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 px-2 ml-1 hover:bg-primary/10">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                  {getInitials(displayPersonName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start ml-2">
                <span className="text-sm font-medium text-foreground font-display">{displayPersonName}</span>
                <span className="text-xs text-muted-foreground">{displayName}</span>
              </div>
              <ChevronDown className="h-4 w-4 ml-2 text-primary" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56 !bg-popover !border-border shadow-lg"
            align="end"
            sideOffset={8}
          >
            {/* User Info Section */}
            <DropdownMenuLabel className="font-normal !text-primary">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-foreground">{displayPersonName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="!bg-border" />

            {/* Quick Actions */}
            <DropdownMenuItem
              onClick={() => router.push('/business/wallet')}
              className="!text-foreground hover:!text-foreground focus:!text-foreground hover:!bg-primary/10 focus:!bg-primary/10 cursor-pointer"
            >
              <Wallet className="mr-2 h-4 w-4 text-primary" />
              <span>Wallet</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push('/business/settings')}
              className="!text-foreground hover:!text-foreground focus:!text-foreground hover:!bg-primary/10 focus:!bg-primary/10 cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4 text-primary" />
              <span>Account Settings</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push('/business/settings/branding')}
              className="!text-foreground hover:!text-foreground focus:!text-foreground hover:!bg-primary/10 focus:!bg-primary/10 cursor-pointer"
            >
              <Palette className="mr-2 h-4 w-4 text-primary" />
              <span>Branding</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => router.push('/business/domain')}
              className="!text-foreground hover:!text-foreground focus:!text-foreground hover:!bg-primary/10 focus:!bg-primary/10 cursor-pointer"
            >
              <Globe className="mr-2 h-4 w-4 text-primary" />
              <span>Custom Domain</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="!bg-border" />

            {/* Logout */}
            <DropdownMenuItem
              onClick={handleLogout}
              className="!text-destructive hover:!text-destructive focus:!text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Command Palette */}
      <BusinessCommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </motion.header>
  );
}
