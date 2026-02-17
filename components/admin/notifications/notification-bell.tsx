'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminNotifications } from '@/lib/hooks/use-admin-notifications';
import { NotificationItem } from './notification-item';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useAdminNotifications(5);
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 rounded-xl bg-popover border border-border shadow-lg p-0 dropdown-animate">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 whitespace-nowrap flex-shrink-0 normal-case tracking-normal"
              >
                Mark all read
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`
              : 'No new notifications'}
          </p>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Bell className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border">
            <Link
              href="/admin/notifications"
              className="block text-center text-sm text-primary hover:underline"
            >
              View all notifications
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
