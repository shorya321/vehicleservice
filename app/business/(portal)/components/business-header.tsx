'use client';

/**
 * Business Portal Header Component
 * Top navigation bar with user menu
 */

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
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

interface BusinessHeaderProps {
  userEmail: string;
  contactPersonName: string;
}

export function BusinessHeader({ userEmail, contactPersonName }: BusinessHeaderProps) {
  const router = useRouter();

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
    <header className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Left side - can add breadcrumbs or page title here */}
      <div className="flex-1"></div>

      {/* Right side - User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(contactPersonName)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{contactPersonName}</p>
              <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <button
              onClick={() => router.push('/business/settings')}
              className="w-full cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              Settings
            </button>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <button onClick={handleLogout} className="w-full cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
