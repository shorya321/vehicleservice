'use client';

/**
 * Business Portal Header Component
 * Top navigation bar with dynamic branding, logo, and user menu
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { LogOut, Settings, Palette, ChevronDown } from 'lucide-react';
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
import { getBusinessInitials, getContrastColor, DEFAULT_BRANDING } from '@/lib/business/branding-utils';
import { BusinessNotificationBell } from '@/components/business/notifications/notification-bell';

interface BusinessHeaderProps {
  // User info
  userEmail: string;
  contactPersonName: string;

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
  logoUrl,
  primaryColor,
  secondaryColor,
  accentColor,
}: BusinessHeaderProps) {
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);

  // Determine display values with fallbacks
  const displayName = brandName || businessName;
  const bgColor = primaryColor || DEFAULT_BRANDING.primary_color;
  const textColor = getContrastColor(bgColor);
  const initials = getBusinessInitials(businessName);

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
    <header
      style={{
        '--brand-primary': bgColor,
        '--brand-secondary': secondaryColor || DEFAULT_BRANDING.secondary_color,
        '--brand-accent': accentColor || DEFAULT_BRANDING.accent_color,
        backgroundColor: bgColor,
        color: textColor,
      } as React.CSSProperties}
      className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-end border-b px-6"
    >
      {/* Right side - Notification Bell and User Dropdown */}
      <div className="flex items-center gap-2">
        <BusinessNotificationBell />
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 hover:bg-black/10"
            style={{ color: textColor }}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback
                style={{
                  backgroundColor: `${bgColor}1A`,
                  color: bgColor,
                }}
              >
                {getInitials(contactPersonName)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium">{displayName}</span>
              <span className="text-xs opacity-70">{contactPersonName}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          {/* User Info Section */}
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{contactPersonName}</p>
              <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Settings Options */}
          <DropdownMenuItem asChild>
            <button
              onClick={() => router.push('/business/settings')}
              className="w-full cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <button
              onClick={() => router.push('/business/settings/branding')}
              className="w-full cursor-pointer"
            >
              <Palette className="mr-2 h-4 w-4" />
              Branding
            </button>
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem asChild>
            <button onClick={handleLogout} className="w-full cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
