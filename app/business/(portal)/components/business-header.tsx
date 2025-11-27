'use client';

/**
 * Business Portal Header Component
 * Top navigation bar with glassmorphism, theme toggle, and user menu
 *
 * Design System: Premium Indigo - Stripe/Linear/Apple inspired
 * Primary: Deep Indigo (#6366F1)
 * Secondary: Teal (#14B8A6)
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Settings, Palette, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const { isCollapsed } = useSidebar();
  const prefersReducedMotion = useReducedMotion();

  // Sidebar widths - match sidebar component
  const expandedWidth = 240;
  const collapsedWidth = 64;
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
      animate={{
        left: currentWidth,
      }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }
      }
      style={{
        left: prefersReducedMotion ? currentWidth : undefined,
      }}
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center justify-between',
        // Glassmorphism effect
        'bg-[var(--business-surface-1)]/80 backdrop-blur-xl',
        'border-b border-[var(--business-border-subtle)]',
        'px-6',
        'transition-[left] duration-300 ease-out'
      )}
    >
      {/* Left side - Page title / breadcrumbs placeholder */}
      <div className="flex items-center">
        {/* Can be populated with breadcrumbs or page title */}
      </div>

      {/* Right side - Theme Toggle, Notifications, and User Dropdown */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle size="default" />

        {/* Notification Bell */}
        <BusinessNotificationBell />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'flex items-center gap-3 px-3 py-2 h-auto ml-1',
                'text-[var(--business-text-primary)] hover:bg-[var(--business-primary-500)]/10',
                'rounded-xl transition-all duration-200',
                'border border-transparent hover:border-[var(--business-primary-500)]/20'
              )}
              style={{ fontFamily: 'var(--business-font-body)' }}
            >
              <Avatar className="h-9 w-9 border-2 border-[var(--business-primary-500)]/20">
                <AvatarFallback
                  className={cn(
                    'bg-gradient-to-br from-[var(--business-primary-500)]/20 to-[var(--business-primary-600)]/20',
                    'text-[var(--business-primary-400)] text-sm font-semibold'
                  )}
                >
                  {getInitials(displayPersonName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-[var(--business-text-primary)]">
                  {displayPersonName}
                </span>
                <span className="text-xs text-[var(--business-text-muted)]">
                  {displayName}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-[var(--business-text-muted)]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cn(
              'w-64',
              'bg-[var(--business-surface-2)] backdrop-blur-xl',
              'border border-[var(--business-border-default)]',
              'shadow-business-elevated rounded-xl'
            )}
            style={{ fontFamily: 'var(--business-font-body)' }}
            align="end"
            forceMount
          >
            {/* User Info Section */}
            <DropdownMenuLabel className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--business-primary-500)]/20 to-[var(--business-primary-600)]/20">
                  <User className="h-5 w-5 text-[var(--business-primary-400)]" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-[var(--business-text-primary)]">
                    {displayPersonName}
                  </p>
                  <p className="text-xs text-[var(--business-text-muted)]">
                    {userEmail}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[var(--business-border-subtle)]" />

            {/* Settings Options */}
            <div className="p-1">
              <DropdownMenuItem
                onClick={() => router.push('/business/settings')}
                className={cn(
                  'px-3 py-2.5 rounded-lg cursor-pointer',
                  'text-[var(--business-text-secondary)]',
                  'hover:text-[var(--business-text-primary)]',
                  'hover:bg-[var(--business-primary-500)]/10',
                  'focus:bg-[var(--business-primary-500)]/10',
                  'transition-colors duration-200'
                )}
              >
                <Settings className="mr-3 h-4 w-4 text-[var(--business-text-muted)]" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/business/settings/branding')}
                className={cn(
                  'px-3 py-2.5 rounded-lg cursor-pointer',
                  'text-[var(--business-text-secondary)]',
                  'hover:text-[var(--business-text-primary)]',
                  'hover:bg-[var(--business-primary-500)]/10',
                  'focus:bg-[var(--business-primary-500)]/10',
                  'transition-colors duration-200'
                )}
              >
                <Palette className="mr-3 h-4 w-4 text-[var(--business-text-muted)]" />
                Branding
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-[var(--business-border-subtle)]" />

            {/* Logout */}
            <div className="p-1">
              <DropdownMenuItem
                onClick={handleLogout}
                className={cn(
                  'px-3 py-2.5 rounded-lg cursor-pointer',
                  'text-[var(--business-error)]',
                  'hover:text-[var(--business-error)]',
                  'hover:bg-[var(--business-error)]/10',
                  'focus:bg-[var(--business-error)]/10',
                  'transition-colors duration-200'
                )}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
